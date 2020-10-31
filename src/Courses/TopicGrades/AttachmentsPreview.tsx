import React, { useEffect, useState } from 'react';
import { getAttachments } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import logger from '../../Utilities/Logger';
import { ProblemAttachments } from '../CourseInterfaces';


interface AttachmentsPreviewProps {
    gradeId?: number;
    gradeInstanceId?: number;
    workbookId: number;

}

export const AttachmentsPreview: React.FC<AttachmentsPreviewProps> = ({gradeId, gradeInstanceId, workbookId}) => {
    const [attachedFiles, setAttachedFiles] = useState<Array<ProblemAttachments>>([]);
    const [baseUrl, setBaseUrl] = useState<string>(window.location.host);

    // Get list of attached files.
    useEffect(()=>{
        (async () => {
            try {
                const res = await getAttachments({ 
                    studentWorkbookId: workbookId
                });

                const alreadyAttachedFiles = res.data.data.attachments;
                const baseUrl = res.data.data.baseUrl;

                setBaseUrl(baseUrl);
                setAttachedFiles(alreadyAttachedFiles.map(file => new ProblemAttachments(file)));
            } catch (e) {
                logger.error('Failed to get attachments.', e);
            }
        })();
    }, [gradeId, gradeInstanceId, workbookId])

    return (
        <>
            {
                attachedFiles.map(attachment => (
                    <>
                        {attachment.userLocalFilename}
                        <iframe />
                    </>
                ))
            }
        </>
    );
};


export default AttachmentsPreview;