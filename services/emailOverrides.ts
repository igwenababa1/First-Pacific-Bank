export const getGlobalTemplateOverride = (templateId: string, variables: Record<string, string>) => {
    try {
        if (typeof window === 'undefined') return null;
        const sysOptsStr = localStorage.getItem('prb_system_options_v2');
        if (!sysOptsStr) return null;
        const sysOpts = JSON.parse(sysOptsStr);
        if (sysOpts.emailOverrides && sysOpts.emailOverrides[templateId]) {
            const override = sysOpts.emailOverrides[templateId];
            if (!override.enabled) return { enabled: false };

            let subject = override.subject;
            let body = override.body;

            for (const [key, val] of Object.entries(variables)) {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, val);
                body = body.replace(regex, val);
            }

            return { subject, html: body, enabled: true };
        }
    } catch (e) {
        console.error("Failed to parse email overrides", e);
    }
    return null;
};
