import { useState, useEffect } from 'react';
import { db } from '../services/database';
import { socket } from '../services/socket';
import { SystemOptions } from '../services/database';

export const useSystemOptions = () => {
    const [systemOptions, setSystemOptions] = useState<SystemOptions | null>(null);

    useEffect(() => {
        let mounted = true;
        
        const fetchOptions = async () => {
            const opts = await db.getSystemOptions();
            if (mounted) setSystemOptions(opts);
        };
        fetchOptions();

        const handleSocket = (opts: SystemOptions) => {
            if (opts) setSystemOptions(opts);
        };

        socket.on('admin:system_options_updated', handleSocket);

        return () => {
            mounted = false;
            socket.off('admin:system_options_updated', handleSocket);
        };
    }, []);

    return systemOptions;
};
