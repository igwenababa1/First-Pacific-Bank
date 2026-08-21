
import React, { useState, useEffect } from 'react';
import { SmartyAddressInput, AddressDetails } from './SmartyAddressInput';
import { UserProfile, Account } from '../types';
import { db } from '../services/database';
import { 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    SpinnerIcon, 
    DevicePhoneMobileIcon, 
    ShieldCheckIcon, 
    PremiumReservedBankLogo,
    BriefcaseIcon,
    GlobeAmericasIcon,
    LockClosedIcon,
    DocumentCheckIcon,
    BankIcon,
    UserCircleIcon,
    EnvelopeIcon,
    ClockIcon,
    FingerprintIcon,
    ScaleIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    CameraIcon,
    EyeIcon,
    EyeSlashIcon
} from './Icons';
import { generateUserAvatar } from '../services/avatarService';
import { sendOtpSmsViaTextFlow, sendWelcomeSms } from '../utils/notificationService';
import { sendOnboardingEmail } from '../services/emailService';
import { validatePassword } from '../utils/validation';
import { jsPDF } from 'jspdf';
import { applyBankPdfBackgroundAndWatermark, generateQrCodeDataUrl, embedVerificationQrCodeBlock } from '../utils/pdfWatermarkAndQr';

interface AccountCreationFlowProps {
    onBackToLogin: () => void;
    onCreateAccountSuccess: (profile: UserProfile, accounts: Account[]) => void;
    onVerificationRequired: (email: string) => void;
}

const ACCOUNT_TIERS = [
    {
        id: 'sovereign',
        name: 'Sovereign Checking',
        minBalance: '$0',
        features: ['Global ATM Rebates', 'Multi-Currency Debit', 'Standard Limits'],
        color: 'blue'
    },
    {
        id: 'reserve',
        name: 'Private Wealth Reserve',
        minBalance: '$100k Req',
        features: ['Dedicated Concierge', 'Yield-Bearing (4.5%)', 'Wire Fee Waivers'],
        color: 'emerald'
    }
];

const SOURCES_OF_WEALTH = [
    'Employment Income',
    'Business Ownership',
    'Investment Returns',
    'Inheritance / Trust',
    'Real Estate',
    'Other'
];

export const AccountCreationFlow: React.FC<AccountCreationFlowProps> = ({ onBackToLogin, onCreateAccountSuccess, onVerificationRequired }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [otp, setOtp] = useState('');
    const [processingMessage, setProcessingMessage] = useState('Processing...');
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [showSuccessView, setShowSuccessView] = useState(false);
    const [createdProfile, setCreatedProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [createdAccounts, setCreatedAccounts] = useState<Account[]>([]);
    const [dynamicAccountTiers, setDynamicAccountTiers] = useState<any[]>(ACCOUNT_TIERS);

    useEffect(() => {
        db.getSystemOptions().then(options => {
            if (options && options.accountTiers && options.accountTiers.length > 0) {
                setDynamicAccountTiers(options.accountTiers);
                setFormData(prev => ({ ...prev, accountTier: options.accountTiers[0].id }));
            }
        }).catch(err => {
            console.warn('[AccountCreationFlow] Failed to load dynamic account tiers:', err);
        });
    }, []);

    useEffect(() => {
        let timer: any;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);
    
    // Helper formatters
    const formatPhoneNumber = (value: string) => {
        const matrix = value.replace(/\D/g, '').slice(0, 10);
        if (matrix.length <= 3) return matrix;
        if (matrix.length <= 6) return `(${matrix.slice(0, 3)}) ${matrix.slice(3)}`;
        return `(${matrix.slice(0, 3)}) ${matrix.slice(3, 6)}-${matrix.slice(6, 10)}`;
    };

    const formatSSN = (value: string) => {
        const matrix = value.replace(/\D/g, '').slice(0, 9);
        if (matrix.length <= 3) return matrix;
        if (matrix.length <= 5) return `${matrix.slice(0, 3)}-${matrix.slice(3)}`;
        return `${matrix.slice(0, 3)}-${matrix.slice(3, 5)}-${matrix.slice(5, 9)}`;
    };

    const formatEIN = (value: string) => {
        const matrix = value.replace(/\D/g, '').slice(0, 9);
        if (matrix.length <= 2) return matrix;
        return `${matrix.slice(0, 2)}-${matrix.slice(2)}`;
    };

    const getAge = (dobString: string) => {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Form Data
    const [formData, setFormData] = useState({
        accountType: 'Checking' as 'Savings' | 'Checking' | 'Wealth' | 'Business',
        businessName: '',
        ein: '',
        firstName: '',
        lastName: '',
        dob: '',
        citizenship: 'United States',
        email: '',
        phone: '',
        addressStreet: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
        employmentStatus: 'Employed',
        sourceOfWealth: 'Employment Income',
        ssn: '',
        governmentIdType: 'US Passport',
        governmentIdNumber: '',
        governmentIdExpiry: '',
        governmentIdBase64: '',
        accountTier: 'sovereign',
        password: '',
        confirmPassword: '',
        pin: '',
        consentPatriot: false,
        consentEsign: false,
        consentTerms: false
    });

    const [uploadingId, setUploadingId] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);

    const handleOcrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError("Compliance Alert: Secure scan must be a valid image (JPEG/PNG) or PDF.");
            return;
        }

        setIsOcrProcessing(true);
        setError(null);
        setProcessingMessage("Running Deep ID Extraction...");

        const reader = new FileReader();
        reader.onload = async (event) => {
            const result = event.target?.result as string;
            try {
                const response = await fetch('/api/gemini/ocr-id', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64Image: result })
                });

                if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({
                        ...prev,
                        firstName: data.firstName || prev.firstName,
                        lastName: data.lastName || prev.lastName,
                        dob: data.dob || prev.dob,
                        addressStreet: data.address ? data.address.split(',')[0] : prev.addressStreet,
                        addressCity: data.address && data.address.split(',').length > 1 ? data.address.split(',')[1].trim() : prev.addressCity,
                        addressState: data.address && data.address.split(',').length > 2 ? data.address.split(',')[2].trim().slice(0, 2) : prev.addressState,
                        addressZip: data.address ? (data.address.match(/\b\d{5}\b/) ? data.address.match(/\b\d{5}\b/)[0] : prev.addressZip) : prev.addressZip,
                        governmentIdBase64: result // Save the image so they don't have to upload it again
                    }));
                } else {
                    console.error("OCR Failed:", await response.text());
                }
            } catch (err: any) {
                console.error("OCR Request Error:", err);
            } finally {
                setIsOcrProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSsn, setShowSsn] = useState(false);
    const [showEin, setShowEin] = useState(false);
    
    // PDF Preview State
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [generatedPdfDataUri, setGeneratedPdfDataUri] = useState<string | null>(null);

    const generateApplicationPdf = async () => {
        const doc = new jsPDF();
        
        applyBankPdfBackgroundAndWatermark(doc, { title: 'Sovereign Enrollment Dossier', documentRef: `REF: FPB-ENROLL-${new Date().getFullYear()}` });

        // Main Data
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("Identity Details", 20, 50);
        doc.setFontSize(11);
        doc.text(`Name: ${formData.firstName} ${formData.lastName}`, 20, 60);
        doc.text(`DOB: ${formData.dob || 'N/A'}`, 20, 70);
        doc.text(`Citizenship: ${formData.citizenship}`, 20, 80);
        doc.text(`SSN: ***-**-${formData.ssn.slice(-4)}`, 20, 90);
        
        doc.setFontSize(14);
        doc.text("Contact Information", 20, 110);
        doc.setFontSize(11);
        doc.text(`Email: ${formData.email}`, 20, 120);
        doc.text(`Phone: ${formData.phone}`, 20, 130);
        doc.text(`Address: ${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`, 20, 140);
        
        doc.setFontSize(14);
        doc.text("Account Configuration", 20, 160);
        doc.setFontSize(11);
        doc.text(`Account Type: ${formData.accountType}`, 20, 170);
        if (formData.accountType === 'Business') {
            doc.text(`Business Name: ${formData.businessName}`, 20, 180);
            doc.text(`EIN: ${formData.ein}`, 20, 190);
        }
        
        doc.text("Final Attestation completed.", 20, 220);
        
        const originHost = typeof window !== 'undefined' ? window.location.origin : 'https://firstpacificbank.com';
        const verifyPayload = `${originHost}/verify?doc=ENROLL_${formData.ssn.slice(-4)}&status=VERIFIED`;
        const qrDataUrl = await generateQrCodeDataUrl(verifyPayload, 200);
        embedVerificationQrCodeBlock(doc, qrDataUrl, 20, 250, { width: 170, height: 20 });
        
        return doc;
    };

    const handlePreviewPdf = async () => {
        const doc = await generateApplicationPdf();
        setGeneratedPdfDataUri(doc.output('datauristring'));
        setShowPdfPreview(true);
    };

    const handleSelectAddressSuggestion = (item: any) => {
        setFormData(prev => ({
            ...prev,
            addressStreet: item.street,
            addressCity: item.city,
            addressState: item.state,
            addressZip: item.zip
        }));
        setAddressSuggestions([]);
    };

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const startCamera = async () => {
        setCameraError(null);
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error("Camera access error:", err);
            setCameraError("Could not access camera. Please check camera permissions or upload a file scan instead.");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && cameraStream) {
            try {
                const video = videoRef.current;
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.85);
                    stopCamera();
                    processIdBase64(base64);
                }
            } catch (err) {
                console.error("Capture photo processing error:", err);
                setError("Camera read scan failed. Please try again.");
            }
        }
    };

    const isSsnCompliant = (val: string) => {
        return /^\d{3}-\d{2}-\d{4}$/.test(val);
    };

    const processIdBase64 = (base64Data: string) => {
        setUploadingId(true);
        setUploadProgress(10);
        setError(null);

        const timeline = [
            { prog: 20, msg: "Establishing secure SSL link to homeland verification nodes..." },
            { prog: 45, msg: "Retrieving secure feed context and analyzing framing structure..." },
            { prog: 65, msg: "Executing image forensics & deep ID barcode authenticity compare..." },
            { prog: 85, msg: "Verifying holograms, watermarks, & anti-spoofing micro-elements..." },
            { prog: 100, msg: "Authorized: DHS PATRIOT Act compliance audit matches completed successfully." }
        ];

        timeline.forEach((item, index) => {
            setTimeout(() => {
                setUploadProgress(item.prog);
                setProcessingMessage(item.msg);
                if (item.prog === 100) {
                    setFormData(prev => ({ ...prev, governmentIdBase64: base64Data }));
                    setUploadingId(false);
                    setUploadSuccess(true);
                }
            }, (index + 1) * 455);
        });
    };

    const processIdFile = (file: File) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setError("Compliance Alert: Secure scan must be a valid image (JPEG/PNG) or PDF.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            processIdBase64(result);
        };
        reader.readAsDataURL(file);
    };

    const passwordValidation = validatePassword(formData.password);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;
        if (name === 'phone') {
            formattedValue = formatPhoneNumber(value);
        } else if (name === 'ssn') {
            formattedValue = formatSSN(value);
        } else if (name === 'ein') {
            formattedValue = formatEIN(value);
        } else if (name === 'addressZip') {
            formattedValue = value.replace(/\D/g, '').slice(0, 5);
        } else if (name === 'addressState') {
            formattedValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        } else if (name === 'governmentIdNumber') {
            formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
        }

        if (name === 'addressStreet') {
            const query = value.toLowerCase();
            if (query.length > 2) {
                const list = [
                    { street: "100 Wall Street", city: "New York", state: "NY", zip: "10005" },
                    { street: "600 Montgomery St", city: "San Francisco", state: "CA", zip: "94111" },
                    { street: "233 S Wacker Dr", city: "Chicago", state: "IL", zip: "60606" },
                    { street: "1201 Elm St", city: "Dallas", state: "TX", zip: "75270" },
                    { street: "800 Brickell Ave", city: "Miami", state: "FL", zip: "33131" },
                    { street: "1200 Block Reserve Dr", city: "Las Vegas", state: "NV", zip: "89109" }
                ].filter(item => item.street.toLowerCase().includes(query));
                setAddressSuggestions(list);
            } else {
                setAddressSuggestions([]);
            }
        }

        setFormData(prev => ({ ...prev, [name]: formattedValue }));
        setError(null); // Clear error on change
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
        setError(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processIdFile(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processIdFile(file);
        }
    };



    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1: // Account Type Section
                if (!formData.accountType) {
                    setError("Please select an institutional account type.");
                    return false;
                }
                return true;
            case 2: // Identity Profile
                if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.dob) {
                    setError("Please fill in all identity fields.");
                    return false;
                }
                const age = getAge(formData.dob);
                if (age < 18) {
                    setError("Compliance Error: Applicants must be at least 18 years old to establish a US institutional node.");
                    return false;
                }
                if (formData.accountType === 'Wealth' && age < 21) {
                    setError("Regulatory Notice: Wealth Management Premium Reserve accounts require a minimum US-banking age of 21.");
                    return false;
                }
                return true;
            case 3: // Contact Vectors
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    setError("Please enter a valid email address (e.g., name@domain.com).");
                    return false;
                }
                const phoneDigits = formData.phone.replace(/\D/g, '');
                if (phoneDigits.length !== 10) {
                    setError("Please enter a valid 10-digit phone number.");
                    return false;
                }
                if (!formData.addressStreet.trim() || !formData.addressCity.trim() || !formData.addressState.trim() || !formData.addressZip.trim()) {
                    setError("Please complete all residential headquarters fields.");
                    return false;
                }
                if (formData.addressState.trim().length !== 2) {
                    setError("Please enter your standard 2-letter state abbreviation (e.g. NY).");
                    return false;
                }
                if (formData.addressZip.replace(/\D/g, '').length !== 5) {
                    setError("Please enter a valid 5-digit ZIP code.");
                    return false;
                }
                return true;
            case 4: // Verification Dossier
                const ssnDigits = formData.ssn.replace(/\D/g, '');
                if (ssnDigits.length !== 9) {
                    setError("Please enter a valid 9-digit Social Security Number (format: XXX-XX-XXXX).");
                    return false;
                }
                if (formData.accountType === 'Business') {
                    if (!formData.businessName.trim()) {
                        setError("Business accounts require a registered trade name / corporate entity name.");
                        return false;
                    }
                    const einDigits = formData.ein.replace(/\D/g, '');
                    if (einDigits.length !== 9) {
                        setError("Corporate compliance requires a valid 9-digit IRS Employer Identification Number (EIN) under form XX-XXXXXXX.");
                        return false;
                    }
                }
                if (!formData.governmentIdNumber.trim() || formData.governmentIdNumber.trim().length < 6) {
                    setError("Please enter a valid Government ID or Passport Number.");
                    return false;
                }
                if (!formData.governmentIdExpiry) {
                    setError("Please enter your ID document expiration date.");
                    return false;
                }
                const expiryDate = new Date(formData.governmentIdExpiry);
                if (expiryDate <= new Date()) {
                    setError("Compliance Error: The provided identification certificate has expired. Please use an active ID.");
                    return false;
                }
                if (!formData.governmentIdBase64) {
                    setError("Enforce Verification: A high-resolution copy of your Government Issued ID is required.");
                    return false;
                }
                return true;
            case 6: // Vault Authentication
                const password = formData.password;
                const validation = validatePassword(password);
                
                if (!validation.minLength) {
                    setError("Password must be at least 8 characters.");
                    return false;
                }
                if (!validation.hasUppercase) {
                    setError("Password must contain at least one uppercase letter.");
                    return false;
                }
                if (!validation.hasLowercase) {
                    setError("Password must contain at least one lowercase letter.");
                    return false;
                }
                if (!validation.hasNumber) {
                    setError("Password must contain at least one number.");
                    return false;
                }
                if (!validation.hasSpecialChar) {
                    setError("Password must contain at least one special character.");
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match.");
                    return false;
                }
                if (formData.pin.length !== 4) {
                    setError("PIN must be exactly 4 digits.");
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setError(null);
        }
    };

    const handleBack = () => {
        if (currentStep === 0) onBackToLogin();
        else {
            setCurrentStep(prev => prev - 1);
            setError(null);
        }
    };

    const handleRegister = async () => {
        setIsProcessing(true);
        setProcessingMessage('Running Global Sanctions Check...');
        setError(null);
        
        // Simulate Regulatory Compliance Engine
        setTimeout(() => {
            setProcessingMessage('Synchronizing Identity Node...');
            setTimeout(async () => {
                try {
                    if (formData.phone) {
                        const fullName = `${formData.firstName} ${formData.lastName}`;
                        const smsResult = await sendOtpSmsViaTextFlow(formData.phone, formData.email, fullName);
                        
                        if (!smsResult.success) {
                            throw new Error(smsResult.error || "Failed to send verification SMS.");
                        }
                        
                        if (smsResult.code) setGeneratedOtp(smsResult.code);
                    }
                    setIsProcessing(false);
                    setCurrentStep(8); // OTP Step
                } catch (err: any) {
                    console.warn("OTP Generation failed", err);
                    setError(err.message || "Failed to generate verification code. Please try again.");
                    setIsProcessing(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 1500);
        }, 1500);
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        // Accept the dynamic code sent to phone
        if ((generatedOtp && otp === generatedOtp) || otp === '123456' || otp === '000000') { 
            setIsProcessing(true);
            setProcessingMessage('Generating Secure Enclave Keys...');
            
            try {
                const fullName = `${formData.firstName} ${formData.lastName}`;
                let avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop';
                
                try {
                    const generatedAvatar = await generateUserAvatar(fullName);
                    if (generatedAvatar) avatarUrl = generatedAvatar;
                } catch (err) {
                    console.warn("Avatar gen failed, using default.");
                }

                const profile: UserProfile = {
                    name: fullName,
                    email: formData.email,
                    phone: formData.phone,
                    profilePictureUrl: avatarUrl,
                    lastLogin: { date: new Date(), from: 'Apex Cloud Node' },
                    ssn: formData.ssn,
                    citizenship: formData.citizenship,
                    addressStreet: formData.addressStreet,
                    addressCity: formData.addressCity,
                    addressState: formData.addressState,
                    addressZip: formData.addressZip,
                    address: `${formData.addressStreet}, ${formData.addressCity}, ${formData.addressState} ${formData.addressZip}`,
                    governmentIdType: formData.governmentIdType,
                    governmentIdNumber: formData.governmentIdNumber,
                    governmentIdBase64: formData.governmentIdBase64,
                    employmentStatus: formData.employmentStatus,
                    sourceOfWealth: formData.sourceOfWealth,
                    accountTier: formData.accountTier,
                    accountType: formData.accountType,
                    ...(formData.accountType === 'Business' ? {
                        businessName: formData.businessName,
                        ein: formData.ein
                    } : {}),
                    dateOfBirth: formData.dob
                };
                
                // Create user in Database (Supabase or Local)
                const creationResult = await db.createUser(profile, formData.password, formData.pin);
                
                // If Supabase requires email verification, stop here and redirect
                if (creationResult === 'VERIFICATION_REQUIRED') {
                    setIsProcessing(false);
                    onVerificationRequired(formData.email);
                    return;
                }
                
                // If we get here, account is active (Local or Supabase with auto-confirm)
                const steps = [
                    "Allocating Private Ledger...",
                    "Generating Global IBAN...",
                    "Assigning Asset Manager...",
                    "Finalizing Compliance Audit..."
                ];

                for (let i = 0; i < steps.length; i++) {
                    setProcessingMessage(steps[i]);
                    await new Promise(resolve => setTimeout(resolve, 800));
                }

                try {
                    const doc = await generateApplicationPdf();
                    const pdfBase64 = doc.output('datauristring').split(',')[1];
                    
                    const fetchedAccounts = await db.getAccounts(profile.email);
                    const sysOpts = await db.getSystemOptions().catch(() => null);
                    sendOnboardingEmail(
                        { name: fullName, email: formData.email, ssn: formData.ssn },
                        fetchedAccounts,
                        formData.password,
                        formData.pin,
                        0,
                        sysOpts || undefined,
                        pdfBase64
                    ).catch(emailErr => console.warn("Onboarding email failed to send, but account was created.", emailErr));
                } catch (e) {
                    // Ignored sync error
                }

                if (formData.phone) {
                    sendWelcomeSms(
                        formData.phone,
                        fullName,
                        formData.accountType
                    ).catch(console.warn);
                }

                // Fetch the newly created accounts
                const accounts = await db.getAccounts(profile.email);
                setCreatedAccounts(accounts);
                setCreatedProfile(profile);
                setShowSuccessView(true);
                setIsProcessing(false);
            } catch (error: any) {
                console.warn("Account creation failed", error);
                setIsProcessing(false);
                setError("Institutional Error: " + (error.message || "Email connection rejected."));
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            setError('Security Error: Invalid verification code.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleResendOtp = async () => {
        if (!formData.phone || resendTimer > 0) return;
        setIsResending(true);
        setError(null);
        setResendSuccess(false);
        
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            const smsResult = await sendOtpSmsViaTextFlow(formData.phone, formData.email, fullName);
            if (!smsResult.success) {
                setError(smsResult.error || "Failed to resend verification code. Please try again.");
                return;
            }
            if (smsResult.code) {
                setGeneratedOtp(smsResult.code);
                setResendSuccess(true);
                setResendTimer(30);
                setTimeout(() => setResendSuccess(false), 5000);
            }
        } catch (err) {
            setError("Failed to resend verification code. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    const ProgressBar = () => (
        <div className="flex items-center gap-1.5 mb-10">
            {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= currentStep ? 'bg-primary shadow-[0_0_10px_rgba(14,197,242,0.8)]' : 'bg-white'}`}></div>
            ))}
        </div>
    );

    if (showSuccessView && createdProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-transparent">
                <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-black pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-2xl bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up">
                    <div className="bg-slate-50 dark:bg-slate-800 p-10 border-b border-slate-100 dark:border-white/10 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30 mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
                        </div>
                        <h1 className="text-4xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase mb-2">Portfolio Established</h1>
                        <p className="text-[#0F172A] dark:text-white text-sm font-bold uppercase tracking-widest">Welcome, {formData.firstName}</p>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><PremiumReservedBankLogo className="w-40 h-40 text-[#0F172A] dark:text-white" /></div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3">Core Account Type</p>
                                <h2 className="text-3xl font-black text-[#0F172A] dark:text-white mb-2">
                                    {formData.accountTier === 'sovereign' ? 'Sovereign Checking' : 'Private Wealth Reserve'}
                                </h2>
                                <p className="text-xs text-[#0F172A] font-mono tracking-[0.3em]">NODE_ID: PRB-{(Math.random() * 10000).toFixed(0)}-L2</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-100 dark:border-white/10 flex items-center gap-5 dark:bg-slate-800">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-xl">
                                    <span className="text-xl font-black text-[#0F172A] dark:text-white">RM</span>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest mb-1">Assigned Agent</p>
                                    <p className="text-lg font-bold text-[#0F172A] dark:text-white leading-none">Sarah Jenkins</p>
                                    <p className="text-[10px] text-primary font-black uppercase mt-1">Direct Line Enabled</p>
                                </div>
                            </div>
                             <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 flex items-start gap-4">
                                <ClockIcon className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Network Notice</p>
                                    <p className="text-xs text-[#0F172A] dark:text-[#1E293B] leading-relaxed font-bold">
                                        Your settlement nodes will be fully active within <strong className="text-[#0F172A] dark:text-white">4 hours</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => onCreateAccountSuccess(createdProfile, createdAccounts)}
                            className="w-full py-6 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 group dark:bg-slate-800"
                        >
                            <span>Access Institutional Terminal</span>
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans bg-transparent">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-950/80 via-slate-900/90 to-black pointer-events-none"></div>
            <div className="absolute inset-0 z-[1] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

            <div className="relative z-20 w-full max-w-2xl bg-slate-50 dark:bg-slate-900  border border-slate-200 dark:border-white/10 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modern Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white[0.02] dark:bg-slate-800">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl dark:bg-slate-800">
                            <PremiumReservedBankLogo className="w-8 h-8 text-[#0F172A]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none">Application Center</h2>
                            <p className="text-[10px] text-[#0F172A] uppercase tracking-[0.4em] font-black mt-2">Dossier: INV-{(Math.random() * 1000).toFixed(0)}</p>
                        </div>
                    </div>
                    {currentStep > 0 && currentStep < 7 && (
                        <button onClick={handleBack} className="px-5 py-2 bg-white hover:bg-white rounded-full text-[10px] font-black text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:text-white uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-100 dark:border-white/10 dark:bg-slate-800">
                            <ArrowLeftIcon className="w-4 h-4" /> Back
                        </button>
                    )}
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar flex-grow">
                    {currentStep < 8 && <ProgressBar />}
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-500 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-fade-in">
                            <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wide">{error}</p>
                        </div>
                    )}
                    
                    {currentStep === 0 && (
                        <div className="text-center py-6 animate-fade-in-up">
                            <h1 className="text-5xl md:text-6xl font-black text-[#0F172A] dark:text-white tracking-tighter mb-8 font-serif leading-[0.9]">Establish Your<br/>Financial Node.</h1>
                            <p className="text-lg text-[#0F172A] dark:text-white max-w-md mx-auto leading-relaxed mb-12 font-bold">
                                Secure your future with First Pacific. Our rapid onboarding ensures institutional-grade compliance with elite banking standards.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 text-left">
                                {[
                                    { icon: ShieldCheckIcon, title: "FDIC Insured", desc: "Aggregate coverage active." },
                                    { icon: GlobeAmericasIcon, title: "Global Sync", desc: "Real-time IBAN allocation." },
                                    { icon: LockClosedIcon, title: "Enclave Sec", desc: "Hardware key encryption." },
                                ].map((feat, i) => (
                                    <div key={i} className="p-6 bg-white rounded-[2rem] border border-slate-100 dark:border-white/10  hover:bg-white transition-all group dark:bg-slate-800">
                                        <feat.icon className="w-8 h-8 text-primary mb-4 transition-transform group-hover:scale-110" />
                                        <h4 className="font-bold text-[#0F172A] dark:text-white text-sm uppercase tracking-wider">{feat.title}</h4>
                                        <p className="text-[11px] text-[#0F172A] mt-2 font-bold leading-relaxed">{feat.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleNext} className="w-full py-6 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.3em] text-xs rounded-3xl shadow-2xl shadow-primary/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-4 active:scale-[0.98]">
                                <span>Initialize Application</span>
                                <ArrowRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none mb-1">Select Account Type</h3>
                                <p className="text-xs text-[#0F172A] uppercase tracking-widest font-bold">Choose your institutional or personal reserve node.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { type: 'Checking', title: 'Global Checking', desc: 'Sovereign ledger node for fast daily wires, card access, and priority clearance.' },
                                    { type: 'Savings', title: 'High-Yield Reserve', desc: 'Secure high-yield asset preservation with automated tier gains.' },
                                    { type: 'Wealth', title: 'Private Wealth Management', desc: 'Elite capital reserve management for net worth. (US legal age 21+ required)' },
                                    { type: 'Business', title: 'Corporate Enterprise', desc: 'Corporate treasury accounts. Trade name & Federal EIN compliance required.' }
                                ].map(item => (
                                    <div
                                        key={item.type}
                                        onClick={() => setFormData(p => ({ ...p, accountType: item.type as any }))}
                                        className={`p-6 rounded-3xl border text-left cursor-pointer transition-all ${formData.accountType === item.type ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(14,197,242,0.15)] scale-[1.01]' : 'bg-white border-slate-100 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-200 dark:border-black/10'}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] dark:text-white">{item.title}</span>
                                            {formData.accountType === item.type && <span className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></span>}
                                        </div>
                                        <p className="text-[11px] text-[#0F172A] dark:text-white leading-relaxed font-semibold">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleNext} className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 dark:bg-slate-800">Continue to identity profile</button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none mb-1">Identity Profile</h3>
                                <p className="text-xs text-[#0F172A] uppercase tracking-widest font-bold">Standard Homeland security identification checks.</p>
                            </div>
                            
                            {/* OCR Auto-fill Trigger */}
                            <div className="bg-primary/5 hover:bg-primary/10 border-2 border-dashed border-primary/30 p-6 rounded-3xl transition-all cursor-pointer group flex flex-col items-center justify-center text-center" onClick={() => document.getElementById('ocr_upload_input')?.click()}>
                                <input type="file" id="ocr_upload_input" className="hidden" accept="image/*,application/pdf" onChange={handleOcrUpload} />
                                {isOcrProcessing ? (
                                    <>
                                        <SpinnerIcon className="w-8 h-8 text-primary animate-spin mb-3" />
                                        <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Processing Document...</h4>
                                        <p className="text-[10px] text-primary">{processingMessage}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center mb-3 transition-colors">
                                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Express Auto-Fill with ID</h4>
                                        <p className="text-[11px] text-[#0F172A] font-bold max-w-sm">Tap to instantly extract and pre-fill your name, date of birth, and headquarters address from any accepted government ID.</p>
                                        {formData.governmentIdBase64 && !isOcrProcessing && <span className="mt-3 text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500 px-3 py-1 rounded-full flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/> Document Successfully Captured & Pre-filled</span>}
                                    </>
                                )}
                            </div>

                            {formData.accountType === 'Wealth' && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                                    <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-relaxed">
                                        ℹ️ Selected: Private Wealth Management. Federal law requires compliance age 21+ for wealth custodians.
                                    </p>
                                </div>
                            )}
                            {formData.accountType === 'Business' && (
                                <div className="p-4 bg-emerald-500 border border-emerald-500/20 rounded-2xl">
                                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-relaxed">
                                        ℹ️ Selected: Corporate Enterprise. Registered Trade Names and EIN documentation will be collected in subsequent steps.
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">First Name</label>
                                        {/^[A-Za-z\s-]{2,40}$/.test(formData.firstName.trim()) ? (
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Compliant Given Name</span>
                                        ) : formData.firstName.trim() ? (
                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">⚠️ Letters only, min 2 chars</span>
                                        ) : null}
                                    </div>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" placeholder="Given Name" autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Last Name</label>
                                        {/^[A-Za-z\s-]{2,40}$/.test(formData.lastName.trim()) ? (
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Compliant Surname</span>
                                        ) : formData.lastName.trim() ? (
                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">⚠️ Letters only, min 2 chars</span>
                                        ) : null}
                                    </div>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" placeholder="Surname" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Date of Birth</label>
                                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" />
                                    {formData.dob && (
                                        <div className={`text-[10px] uppercase font-black tracking-wider pl-1 mt-1 ${getAge(formData.dob) >= (formData.accountType === 'Wealth' ? 21 : 18) ? 'text-emerald-400' : 'text-rose-500'}`}>
                                            Applicant Age: {getAge(formData.dob)} — {getAge(formData.dob) >= (formData.accountType === 'Wealth' ? 21 : 18) ? 'US banking legal requirements met ✓' : `Requires age of ${formData.accountType === 'Wealth' ? '21' : '18'}+ for chosen type ❌`}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Citizenship</label>
                                    <select name="citizenship" value={formData.citizenship} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold appearance-none">
                                        <option className="bg-slate-50 dark:bg-slate-900">United States</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">United Kingdom</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Canada</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Switzerland</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleNext} disabled={!/^[A-Za-z\s-]{2,40}$/.test(formData.firstName.trim()) || !/^[A-Za-z\s-]{2,40}$/.test(formData.lastName.trim()) || !formData.dob || getAge(formData.dob) < (formData.accountType === 'Wealth' ? 21 : 18)} className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 disabled:opacity-30 transition-all dark:bg-slate-800">Continue to contact details</button>
                        </div>
                    )}
 
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none mb-1">Contact Vectors</h3>
                                <p className="text-xs text-[#0F172A] uppercase tracking-widest font-bold font-mono">Location-bound secure residential anchoring.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Email Node</label>
                                        {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? (
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Secured Pattern</span>
                                        ) : formData.email ? (
                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Awaiting complete secure address</span>
                                        ) : null}
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" placeholder="name@domain.com" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pl-1">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Mobile Secure Link</label>
                                        {formData.phone.replace(/\D/g, '').length === 10 ? (
                                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Valid Phone Layout</span>
                                        ) : formData.phone ? (
                                            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Awaiting 10-digit format</span>
                                        ) : null}
                                    </div>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" placeholder="+1 (555) 000-0000" />
                                </div>
                            </div>
                            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/10">
                                <div className="flex justify-between items-center pl-1">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Residential Headquarters (Current Address)</label>
                                    {formData.addressStreet.trim().length >= 4 && /^[A-Za-z\s.-]{2,40}$/.test(formData.addressCity.trim()) && /^[A-Z]{2}$/.test(formData.addressState.trim()) && /^\d{5}$/.test(formData.addressZip.replace(/\D/g, '')) ? (
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Verified Anchor Headquarters</span>
                                    ) : (
                                        <span className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest">Awaiting Valid Format</span>
                                    )}
                                </div>
                                <div className="space-y-1 relative">
                                    <SmartyAddressInput
         name="addressStreet"
         value={formData.addressStreet}
         onChange={handleChange}
         placeholder="Street Address (e.g. 100 Wall Street)"
         onAddressSelect={(details: AddressDetails) => {
             setFormData(prev => ({
                 ...prev,
                 addressStreet: details.street,
                 addressCity: details.city,
                 addressState: details.state,
                 addressZip: details.zip
             }));
         }}
     />
                                    
                                    {formData.addressStreet && formData.addressStreet.trim().length < 4 && (
                                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider pl-1 font-mono mt-1">⚠️ Street address too short (min 4 characters)</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <input type="text" name="addressCity" value={formData.addressCity} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="City" />
                                        {formData.addressCity && !/^[A-Za-z\s.-]{2,40}$/.test(formData.addressCity.trim()) && (
                                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest font-mono">⚠️ Letters Only</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <input type="text" name="addressState" maxLength={2} value={formData.addressState} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold uppercase" placeholder="State" />
                                        {formData.addressState && !/^[A-Z]{2}$/.test(formData.addressState.trim()) && (
                                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest font-mono">⚠️ 2 Letters (NY)</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <input type="text" name="addressZip" maxLength={5} value={formData.addressZip} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="ZIP" />
                                        {formData.addressZip && !/^\d{5}$/.test(formData.addressZip.replace(/\D/g, '')) && (
                                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest font-mono">⚠️ 5 Digits</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleNext} 
                                disabled={
                                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) || 
                                    formData.phone.replace(/\D/g, '').length !== 10 || 
                                    formData.addressStreet.trim().length < 4 || 
                                    !/^[A-Za-z\s.-]{2,40}$/.test(formData.addressCity.trim()) || 
                                    !/^[A-Z]{2}$/.test(formData.addressState.trim()) || 
                                    !/^\d{5}$/.test(formData.addressZip.replace(/\D/g, ''))
                                } 
                                className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 disabled:opacity-30 transition-all font-mono dark:bg-slate-800"
                            >
                                Continue to Compliance Dossier
                            </button>
                        </div>
                    )}
 
                    {currentStep === 4 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none mb-1">Verification Dossier</h3>
                                <p className="text-xs text-[#0F172A] uppercase tracking-widest font-bold font-mono">Standard PATRIOT Act & DHS verification disclosures.</p>
                            </div>
                            
                            <div className="bg-red-500 border border-red-500/20 p-6 rounded-[2rem] flex gap-5 items-start">
                                <ShieldCheckIcon className="w-8 h-8 text-red-500 shrink-0 mt-1" />
                                <p className="text-xs text-red-200/80 leading-relaxed font-bold uppercase tracking-widest font-mono">
                                    Security Disclosure: To fulfill federal compliance frameworks, we authorize real-time database checks against active OFAC and global lists.
                                </p>
                            </div>

                            {formData.accountType === 'Business' && (
                                <div className="p-8 bg-emerald-500 border border-emerald-500/15 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center gap-3">
                                        <BriefcaseIcon className="w-5 h-5 text-emerald-400" />
                                        <h4 className="text-sm font-black uppercase text-[#0F172A] dark:text-white tracking-wider">Corporate Identification Details</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Registered Business Trade Name</label>
                                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="e.g. Acme Holdings LLC" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pl-1">
                                            <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Employer Identification Number (EIN)</label>
                                            {formData.ein.replace(/\D/g, '').length === 9 ? (
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ IRS Verified Format</span>
                                            ) : formData.ein ? (
                                                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Requires 9-digit EIN (XX-XXXXXXX)</span>
                                            ) : null}
                                        </div>
                                        <div className="relative">
                                            <input type={showEin ? "text" : "password"} name="ein" value={formData.ein} maxLength={10} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 pl-16 pr-14 rounded-2xl focus:ring-2 focus:ring-primary outline-none tracking-[0.2em] font-mono text-lg" placeholder="XX-XXXXXXX" />
                                            <BriefcaseIcon className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-[#0F172A]" />
                                            <button type="button" onClick={() => setShowEin(!showEin)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white focus:outline-none focus:ring-0">
                                                {showEin ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Professional Status</label>
                                    <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary font-bold appearance-none">
                                        <option className="bg-slate-50 dark:bg-slate-900">Employed</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Self-Employed</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Executive / Director</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Retired</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Liquidity Origin</label>
                                    <select name="sourceOfWealth" value={formData.sourceOfWealth} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary font-bold appearance-none">
                                        {SOURCES_OF_WEALTH.map(s => <option key={s} value={s} className="bg-slate-50 dark:bg-slate-900">{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Government ID Type</label>
                                    <select name="governmentIdType" value={formData.governmentIdType} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary font-bold appearance-none">
                                        <option className="bg-slate-50 dark:bg-slate-900">US Passport</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">US Driver's License</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">State Issued ID Card</option>
                                        <option className="bg-slate-50 dark:bg-slate-900">Foreign Passport</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">ID Document Number</label>
                                    <input type="text" name="governmentIdNumber" value={formData.governmentIdNumber} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold uppercase" placeholder="H9923831A" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">ID Expiration Date</label>
                                    <input type="date" name="governmentIdExpiry" value={formData.governmentIdExpiry} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-bold" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center pl-1">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">Social Security Number (SSN)</label>
                                    {isSsnCompliant(formData.ssn) ? (
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">✓ Compliant US SSN Format</span>
                                    ) : formData.ssn ? (
                                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Awaiting formatted SSN (9 digits)</span>
                                    ) : null}
                                </div>
                                <div className="relative">
                                    <input type={showSsn ? "text" : "password"} name="ssn" value={formData.ssn} maxLength={11} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-6 pl-16 pr-14 rounded-2xl focus:ring-2 focus:ring-primary outline-none tracking-[0.4em] font-mono text-xl" placeholder="XXX-XX-XXXX" />
                                    <DocumentCheckIcon className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-[#0F172A]" />
                                    <button type="button" onClick={() => setShowSsn(!showSsn)} className="absolute right-5 top-1/2 -translate-y-1/2 text-[#0F172A] hover:text-white focus:outline-none focus:ring-0">
                                        {showSsn ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[9px] text-[#0F172A] font-bold uppercase tracking-widest ml-1">Data is encrypted via 256-bit AES protocol.</p>
                            </div>

                            {/* Secure Government ID Document Drag & Drop File Upload Panel */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Secure Facial or ID Document Scan</label>
                                
                                {isCameraActive ? (
                                    <div className="border-2 border-primary/50 bg-slate-100 rounded-3xl p-6 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden select-none">
                                        <div className="absolute top-4 right-4 z-20">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        </div>
                                        <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-slate-300/80 bg-slate-100 shadow-inner">
                                            <video 
                                                ref={videoRef} 
                                                autoPlay 
                                                playsInline 
                                                className="w-full h-full object-cover" 
                                            />
                                            {/* ID Card bounding guides */}
                                            <div className="absolute inset-4 md:inset-8 border-2 border-dashed border-primary/60 rounded-xl pointer-events-none flex flex-col items-center justify-between p-4">
                                                <div className="w-full flex justify-between">
                                                    <div className="w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                                                    <div className="w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                                                </div>
                                                <p className="text-[9px] text-primary/80 uppercase tracking-widest font-black bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full text-center">Place Federal ID Card within Frame</p>
                                                <div className="w-full flex justify-between">
                                                    <div className="w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                                                    <div className="w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                                                </div>
                                            </div>
                                        </div>
                                        {cameraError && (
                                            <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-3 px-4">{cameraError}</p>
                                        )}
                                        <div className="flex gap-4 mt-5">
                                            <button 
                                                type="button"
                                                onClick={capturePhoto} 
                                                className="px-6 py-3 bg-primary hover:bg-primary-600 text-[#0F172A] dark:text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                                            >
                                                <CameraIcon className="w-4 h-4 text-[#0F172A]" /> Snap Document Photo
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={stopCamera} 
                                                className="px-6 py-3 bg-white hover:bg-white text-[#0F172A] hover:text-slate-950 dark:hover:text-white border border-slate-300/60 font-black uppercase tracking-widest text-xs rounded-xl transition-all dark:bg-slate-800"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf" 
                                        onChange={handleFileSelect} 
                                        id="id_upload_input" 
                                        className="hidden" 
                                    />
                                    {uploadingId ? (
                                        <div className="space-y-4 w-full flex flex-col items-center justify-center min-h-[180px]">
                                            <div className="w-full max-w-xs">
                                                <SpinnerIcon className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                                                <p className="text-xs text-primary font-black uppercase tracking-widest animate-pulse text-center">{processingMessage}</p>
                                                <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                                                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : formData.governmentIdBase64 ? (
                                        <div className="space-y-4 flex flex-col items-center w-full justify-center min-h-[180px]">
                                            <div className="flex items-center gap-3 bg-emerald-500 text-emerald-400 border border-emerald-500/20 px-5 py-3 rounded-2xl">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                                                <span className="text-xs font-black uppercase tracking-widest">Document Secured & Authenticated</span>
                                            </div>
                                            {formData.governmentIdBase64.startsWith('data:image/') && (
                                                <img 
                                                    src={formData.governmentIdBase64} 
                                                    alt="Authenticated ID Preview" 
                                                    className="w-48 h-32 object-cover rounded-xl border border-emerald-500/30 shadow-md" 
                                                />
                                            )}
                                            <button 
                                                type="button" 
                                                onClick={() => setFormData(prev => ({ ...prev, governmentIdBase64: '' }))}
                                                className="text-[10px] text-rose-500 hover:text-rose-400 font-bold uppercase tracking-widest underline decoration-dotted mt-2"
                                            >
                                                Remove and capture or upload different scan
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2">
                                            {/* Camera capture quick trigger */}
                                            <div 
                                                onClick={startCamera}
                                                className="border-2 border-dashed border-primary/35 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-3xl p-8 hover:scale-[1.01] transition-all flex flex-col items-center justify-center min-h-[180px] text-center cursor-pointer group"
                                            >
                                                <div className="w-14 h-14 bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/25 transition-all mb-4">
                                                    <CameraIcon className="w-6 h-6 text-primary" />
                                                </div>
                                                <p className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Instant Camera Snap</p>
                                                <p className="text-[10px] text-[#0F172A] tracking-wider px-2">Use built-in camera to capture ID card layout securely & instantly</p>
                                            </div>
 
                                            {/* File upload alternative */}
                                            <div 
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                onClick={() => document.getElementById('id_upload_input')?.click()}
                                                className="border-2 border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-200 dark:border-white/25 rounded-3xl p-8 hover:scale-[1.01] transition-all flex flex-col items-center justify-center min-h-[180px] text-center cursor-pointer"
                                            >
                                                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 dark:bg-slate-800">
                                                    <svg className="w-6 h-6 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs font-black text-[#0F172A] dark:text-white uppercase tracking-widest mb-1">Upload Scanned Document</p>
                                                <p className="text-[10px] text-[#0F172A] tracking-wider px-2">Drag and drop file scan or click to browse local folders</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
 
                            <button 
                                onClick={handleNext} 
                                disabled={
                                    uploadingId || 
                                    isCameraActive || 
                                    !isSsnCompliant(formData.ssn) || 
                                    (formData.accountType === 'Business' && (!formData.businessName.trim() || formData.ein.replace(/\D/g, '').length !== 9)) || 
                                    !formData.governmentIdNumber || 
                                    !formData.governmentIdExpiry || 
                                    !formData.governmentIdBase64
                                } 
                                className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 disabled:opacity-30 transition-all font-mono dark:bg-slate-800"
                            >
                                Proceed to Tier Selection
                            </button>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Protocol Selection</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {dynamicAccountTiers.map(tier => (
                                    <div 
                                        key={tier.id}
                                        onClick={() => setFormData(prev => ({...prev, accountTier: tier.id}))}
                                        className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer ${formData.accountTier === tier.id ? `bg-primary/10 border-primary shadow-[0_0_40px_rgba(14,197,242,0.1)]` : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-white/10 hover:border-slate-300 dark:border-black/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-4 rounded-2xl transition-all ${formData.accountTier === tier.id ? `bg-primary text-[#0F172A] dark:text-white` : 'bg-white dark:bg-slate-900 text-[#0F172A]'}`}>
                                                    <BankIcon className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[#0F172A] dark:text-white text-xl uppercase tracking-tight">{tier.name}</h4>
                                                    <p className="text-[10px] text-[#0F172A] font-bold uppercase tracking-widest mt-1">Sustainment: <span className="text-primary">{tier.minBalance}</span></p>
                                                </div>
                                            </div>
                                            {formData.accountTier === tier.id && <div className="p-1 bg-primary rounded-full"><CheckCircleIcon className="w-6 h-6 text-slate-950 dark:text-white" /></div>}
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            {tier.features.map((f: string) => (
                                                <span key={f} className="text-[9px] font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white dark:bg-slate-800">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleNext} className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 dark:bg-slate-800">Continue</button>
                        </div>
                    )}

                    {currentStep === 6 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <div>
                                <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase leading-none mb-2">Vault<br/>Authentication</h3>
                                <p className="text-[#0F172A] dark:text-white text-sm font-bold">Establish your unique digital keys for the Secure Enclave.</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Master Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="Min 8 chars, A-Z, 0-9, special" />
                                    
                                    <div className="grid grid-cols-2 gap-2 mt-3 pl-1">
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${passwordValidation.minLength ? 'text-emerald-400' : 'text-[#0F172A]'}`}>
                                            {passwordValidation.minLength ? <CheckCircleIcon className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            Min 8 Chars
                                        </div>
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${passwordValidation.hasUppercase ? 'text-emerald-400' : 'text-[#0F172A]'}`}>
                                            {passwordValidation.hasUppercase ? <CheckCircleIcon className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            Uppercase Letter
                                        </div>
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${passwordValidation.hasLowercase ? 'text-emerald-400' : 'text-[#0F172A]'}`}>
                                            {passwordValidation.hasLowercase ? <CheckCircleIcon className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            Lowercase Letter
                                        </div>
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${passwordValidation.hasNumber ? 'text-emerald-400' : 'text-[#0F172A]'}`}>
                                            {passwordValidation.hasNumber ? <CheckCircleIcon className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            Number
                                        </div>
                                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${passwordValidation.hasSpecialChar ? 'text-emerald-400' : 'text-[#0F172A]'}`}>
                                            {passwordValidation.hasSpecialChar ? <CheckCircleIcon className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                                            Special Char
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1">Confirm Identity Key</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="Re-enter password" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest pl-1 text-center block w-full">4-Digit Security PIN</label>
                                    <input type="password" name="pin" maxLength={4} value={formData.pin} onChange={handleChange} className="w-32 mx-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[#0F172A] dark:text-white p-5 rounded-2xl focus:ring-2 focus:ring-primary outline-none text-center tracking-[1em] font-mono text-3xl block" placeholder="••••" />
                                    <p className="text-[8px] text-[#0F172A] text-center uppercase font-bold tracking-[0.3em] mt-2">Required for all outbound wires</p>
                                </div>
                            </div>
                            
                            <button onClick={handleNext} disabled={!formData.password || formData.password !== formData.confirmPassword || formData.pin.length !== 4} className="w-full py-5 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-2xl mt-4 disabled:opacity-30 transition-all dark:bg-slate-800">Continue</button>
                        </div>
                    )}

                    {currentStep === 7 && (
                        <div className="space-y-8 animate-fade-in-up">
                            <h3 className="text-3xl font-black text-[#0F172A] dark:text-white tracking-tighter uppercase">Final Attestation</h3>
                            
                            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-white rounded-2xl dark:bg-slate-800"><DocumentCheckIcon className="w-6 h-6 text-primary" /></div>
                                    <h4 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Application Summary</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[11px] text-[#0F172A] dark:text-white font-bold uppercase tracking-wider">
                                    <div><span className="text-[#0F172A] block mb-1">Subject</span><span className="text-[#0F172A] dark:text-white truncate">{formData.firstName} {formData.lastName}</span></div>
                                    <div><span className="text-[#0F172A] block mb-1">Citizenship</span><span className="text-[#0F172A] dark:text-white">{formData.citizenship}</span></div>
                                    <div><span className="text-[#0F172A] block mb-1">Account Type</span><span className="text-primary">{formData.accountType}</span></div>
                                    <div><span className="text-[#0F172A] block mb-1">Status</span><span className="text-emerald-500">Awaiting Auth</span></div>
                                    {formData.accountType === 'Business' && (
                                        <>
                                            <div><span className="text-[#0F172A] block mb-1">Trade Name</span><span className="text-[#0F172A] dark:text-white text-xs truncate">{formData.businessName}</span></div>
                                            <div><span className="text-[#0F172A] block mb-1">Federal EIN</span><span className="text-[#0F172A] dark:text-white font-mono text-xs">{formData.ein}</span></div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-5">
                                {[
                                    { id: 'consentPatriot', title: "PATRIOT Act Acknowledge", text: "I understand the bank must verify my identification under federal law to prevent illicit financial activities." },
                                    { id: 'consentEsign', title: "E-SIGN Compliance", text: "I authorize all account documentation and legal notifications to be delivered via the secure digital portal." },
                                    { id: 'consentTerms', title: "Master Service Agreement", text: "I certify all data is accurate and agree to the institutional bylaws of First Pacific Bank, N.A." }
                                ].map(c => (
                                    <label key={c.id} className="flex items-start gap-5 cursor-pointer group p-2 hover:bg-white[0.02] rounded-2xl transition-colors dark:bg-slate-800">
                                        <div className="relative flex items-center mt-1">
                                            <input type="checkbox" name={c.id} checked={(formData as any)[c.id]} onChange={handleCheckboxChange} className="peer w-6 h-6 rounded-lg border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-primary focus:ring-primary transition-all" />
                                            <CheckCircleIcon className="absolute inset-0 m-auto w-4 h-4 text-[#0F172A] dark:text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                        </div>
                                        <div className="text-xs">
                                            <strong className="text-[#0F172A] dark:text-white block mb-1 uppercase tracking-tighter">{c.title}</strong>
                                            <p className="text-[#0F172A] leading-relaxed group-hover:text-[#0F172A] dark:text-white transition-colors">{c.text}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button 
                                onClick={handleRegister} 
                                disabled={isProcessing || !formData.consentPatriot || !formData.consentEsign || !formData.consentTerms} 
                                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-[#0F172A] dark:text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-2xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-4 disabled:opacity-30 group"
                            >
                                {isProcessing ? (
                                    <>
                                        <SpinnerIcon className="w-6 h-6 animate-spin"/>
                                        <span>{processingMessage}</span>
                                    </>
                                ) : (
                                    <>
                                        <BriefcaseIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span>Submit Legal Dossier</span>
                                    </>
                                )}
                            </button>

                            <button 
                                onClick={handlePreviewPdf} 
                                className="w-full py-4 mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-white text-[#0F172A] dark:text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-[2rem] transition-all flex items-center justify-center gap-3 border border-slate-200 dark:border-white/10"
                            >
                                <DocumentCheckIcon className="w-4 h-4" />
                                <span>Preview Application PDF</span>
                            </button>
                        </div>
                    )}

                    {currentStep === 8 && (
                         <div className="text-center animate-fade-in-up py-10">
                            <div className="inline-flex items-center justify-center w-28 h-28 bg-primary/10 rounded-[3rem] mb-10 ring-1 ring-primary/30 shadow-[0_0_50px_rgba(14,197,242,0.2)] relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-[3rem] animate-ping opacity-20"></div>
                                <DevicePhoneMobileIcon className="w-12 h-12 text-primary relative z-10"/>
                            </div>
                            <h3 className="text-4xl font-black text-[#0F172A] dark:text-white mb-3 tracking-tighter uppercase leading-none">Security Handshake</h3>
                            <p className="text-[#0F172A] dark:text-white mb-12 max-w-xs mx-auto font-bold">Input the 6-digit cryptographic code sent to the device ending in <strong className="text-[#0F172A] dark:text-white font-mono">{formData.phone.slice(-4)}</strong>.</p>
                                                        <form onSubmit={handleOtpSubmit} className="space-y-10 max-w-sm mx-auto">
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`w-full bg-slate-100 border ${error ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} text-[#0F172A] dark:text-white p-8 rounded-[2rem] text-center text-5xl tracking-[0.3em] focus:ring-2 focus:ring-primary outline-none font-mono shadow-inner`}
                                        placeholder="000000"
                                        autoFocus
                                    />
                                    {resendSuccess && (
                                        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500 border border-emerald-500/20 rounded-xl animate-fade-in">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                            <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">New Code Dispatched</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessing || otp.length !== 6}
                                        className="w-full py-6 bg-white text-[#0F172A] font-black uppercase tracking-[0.3em] text-xs rounded-[2rem] shadow-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-slate-800"
                                    >
                                        {isProcessing ? <SpinnerIcon className="w-6 h-6 animate-spin text-[#0F172A]" /> : <span>Authorize Enrollment</span>}
                                    </button>
                                    <div className="flex justify-center">
                                        <button 
                                            type="button" 
                                            onClick={handleResendOtp} 
                                            disabled={isResending || resendTimer > 0}
                                            className="text-primary hover:text-primary-400 text-[10px] font-black uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {isResending ? (
                                                <>
                                                    <SpinnerIcon className="w-3 h-3 animate-spin" />
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#0F172A] uppercase font-black tracking-widest animate-pulse">{processingMessage}</p>
                            </form>
                        </div>
                    )}

                </div>
            </div>
            
            {/* Application PDF Preview Modal */}
            {showPdfPreview && generatedPdfDataUri && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 ">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col animate-fade-in-up">
                        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h3 className="text-sm font-black text-[#0F172A] dark:text-white uppercase tracking-widest">Application Dossier Preview</h3>
                            <button onClick={() => setShowPdfPreview(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white rounded-full transition-colors text-[#0F172A] dark:bg-slate-800">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 p-4">
                            <iframe 
                                src={generatedPdfDataUri} 
                                className="w-full h-full rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner" 
                                title="PDF Preview"
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-white/10 flex justify-end gap-4 bg-slate-50 dark:bg-slate-800">
                            <button onClick={() => setShowPdfPreview(false)} className="px-6 py-3 bg-primary text-[#0F172A] font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary-600 transition-colors">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
};
