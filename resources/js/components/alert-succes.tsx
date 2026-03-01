// resources/js/components/alert-success.tsx
import { CheckCircleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AlertSuccess({
    message,
    title = 'Success',
}: {
    message: string;
    title?: string;
}) {
    return (
        <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircleIcon className="text-green-600" />
            <AlertTitle className="text-green-800 font-medium">{title}</AlertTitle>
            <AlertDescription className="text-green-700">
                {message}
            </AlertDescription>
        </Alert>
    );
}