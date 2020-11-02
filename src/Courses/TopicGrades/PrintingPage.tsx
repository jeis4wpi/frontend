import React, { useEffect, useRef } from 'react';
import usePortal from 'react-useportal';
import logger from '../../Utilities/Logger';
import _ from 'lodash';

interface PrintingPageProps {
    debug?: boolean;
    open: boolean;
    attachmentsUrls: string[];
}

export const PrintingPage: React.FC<PrintingPageProps> = ({debug = false, open = false, attachmentsUrls}) => {
    const iframeDisplayOptions = debug
        ? { height: 2000, width: 1600 }
        : { style: { opacity: 0 }, height: 0, width: 0, frameBorder: 0 };
    const iframeref = useRef<HTMLIFrameElement>(null);
    const iframeRootRef = useRef<HTMLElement>(null);
    var [openPortal, closePortal, isOpen, Portal] = usePortal({
        bindTo: iframeref.current?.contentDocument?.body
    });

    useEffect(()=>{
        if (_.isNil(iframeref.current)) {
            logger.debug('IFrame hasn\'t been initialized');
        } else {
            logger.debug('IFrame is loaded.');
        }
    }, [iframeref]);

    const print = (source: Window | null = window): void => {
        if (_.isNil(source)) {
            logger.error('Attempted to print, but iframe was null.');
            return;
        }
        source.focus();
        let result = false;
        try {
            result = source.document.execCommand('print', false, undefined); // IE
        } catch {
            // Chrome throws on the execCommand call
            // do nothing
        }
        if (!result) {
            // @ts-ignore bad typings
            source.print(); // Chrome, Firefox and Safari
        }
    };

    useEffect(()=>{
        if (open)
            print(iframeref.current?.contentWindow);
    }, [open]);

    return (
        <>
            <iframe title='Print Iframe' ref={iframeref} {...iframeDisplayOptions}/>
            <Portal>
                {attachmentsUrls.map(url => (
                    <iframe title={url} src={url} key={url} style={{height: '100vh', width: '100vw'}} />
                ))}
            </Portal>
        </>
    );
};

export default PrintingPage;