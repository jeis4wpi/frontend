import React, { useEffect, useState, useRef } from 'react';
import { Button, ButtonGroup, CircularProgress, ClickAwayListener, Grow, MenuList, Paper, Popper, ListSubheader } from '@material-ui/core';
import { startExportOfTopic } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import _ from 'lodash';
import { useRouteMatch } from 'react-router-dom';
import { ExportAllButtonSuboptions } from './ExportAllButtonSuboptions';
import logger from '../../Utilities/Logger';
import * as qs from 'querystring';

interface ExportAllButtonProps {
    topicId: number;
    userId: number | undefined;
}

enum LoadingState {
    UNINITIALIZED,
    UNTOUCHED,
    LOADING,
    SUCCESS,
    ERROR
}

export enum ButtonOptions {
    DOWNLOAD = 'Download PDFs (.zip)',
    EXPORT_ALL = 'Build Student Grade PDFs (.zip)',
    EXPORT_ALL_NO_SOLUTIONS = 'Build Student Grade PDFs Without Solutions (.zip)',
    PRINT_SINGLE = 'Download Selected Student\'s Grades (.pdf)',
    PRINT_SINGLE_NO_SOLUTIONS = 'Download Selected Student\'s Grades Without Solutions (.pdf)',
    PRINT_BLANK = 'Download Worksheet Answer Key (.pdf)',
    PRINT_BLANK_NO_SOLUTIONS = 'Download as Blank Worksheet (.pdf)',
}

export const ExportAllButton: React.FC<ExportAllButtonProps> = ({topicId, userId}) => {
    const [loading, setLoading] = useState<LoadingState>(LoadingState.UNINITIALIZED);
    const [url, setUrl] = useState<string | null>(null);
    const [open, setOpen] = React.useState(false);
    const [buttonState, setButtonState] = useState<ButtonOptions>(ButtonOptions.EXPORT_ALL);
    const intervalRef = useRef<number | undefined>(undefined);
    const splitButtonRef = useRef<HTMLDivElement>(null);
    const { url: path } = useRouteMatch();

    // On mount, check 
    useEffect(()=>{
        checkAndStatusUpdateExport(false);

        return () => clearInterval(intervalRef.current);
    }, []);

    const checkAndStatusUpdateExport = async (force: boolean = false) => {
        // If forced, set loading immediately.
        if (force) setLoading(LoadingState.LOADING);

        try {
            const res = await startExportOfTopic({topicId, force, showSolutions: buttonState === ButtonOptions.EXPORT_ALL});

            if (_.isNil(res.data.data.lastExported) && force === false) {
                setLoading(LoadingState.UNTOUCHED);
            } else if (_.isNil(res.data.data.exportUrl) || force === true) {
                // If the Export URL is null but Last Export wasn't, it's loading.
                // If we're forcing the request, we're always in loading.
                setLoading(LoadingState.LOADING);
                if (_.isNil(intervalRef.current)) {
                    intervalRef.current = setInterval(checkAndStatusUpdateExport, 15000);
                }
            } else {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
                setLoading(LoadingState.SUCCESS);
                setUrl(res.data.data.exportUrl);
                setButtonState(ButtonOptions.DOWNLOAD);

                // This was more friendly, but since it is ambiguous as to whether this includes solutions or not.
                // setButtonState(ButtonOptions.DOWNLOAD_ZIP);

                // Only open the Window on a click. This prevents us from hitting popup blockers
                // and from opening it on every page load.
                if (force)
                    window.open(`/${res.data.data.exportUrl}`, '_blank');
            }
        } catch (e) {
            setLoading(LoadingState.ERROR);
            clearInterval(intervalRef.current);
        }
    };

    const allOnClickActions = () => {
        switch(buttonState) {
        case ButtonOptions.DOWNLOAD:
            if (!url) {
                logger.warn('Download option should not appear if no url is present.');
                return;
            }

            window.open(`/${url}`, '_blank');
            break;
        case ButtonOptions.PRINT_SINGLE:
        case ButtonOptions.PRINT_SINGLE_NO_SOLUTIONS:
            if (!userId) {
                logger.warn('Print Single option should not appear if no userId is selected.');
                return;
            }
            
            window.open(`${path}/print/${userId}?${qs.stringify({showSolutions: buttonState === ButtonOptions.PRINT_SINGLE})}`, '_blank');
            break;
        case ButtonOptions.PRINT_BLANK:
        case ButtonOptions.PRINT_BLANK_NO_SOLUTIONS:
            window.open(`${path}/print/?${qs.stringify({showSolutions: buttonState === ButtonOptions.PRINT_BLANK})}`, '_blank');
            break;
        case ButtonOptions.EXPORT_ALL:
        case ButtonOptions.EXPORT_ALL_NO_SOLUTIONS:
            checkAndStatusUpdateExport(true);
            break;
        default:
            logger.error('Unknown option for ExportAllButton.', buttonState);
        }
    };

    return <>
        <ButtonGroup 
            variant="contained" 
            color="primary" 
            ref={splitButtonRef} 
            aria-label="download all grades as pdfs" 
            disabled={loading === LoadingState.UNINITIALIZED || loading === LoadingState.LOADING}
        >
            <Button onClick={allOnClickActions}>{buttonState}</Button>
            <Button
                color="primary"
                size="small"
                aria-controls={open ? 'split-button-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-label="Select export options"
                aria-haspopup="menu"
                onClick={() => setOpen((prevOpen) => !prevOpen)}
            >
                {loading === LoadingState.LOADING ? 
                    <CircularProgress size={24} /> :
                    <ArrowDropDownIcon />
                }
            </Button>
        </ButtonGroup>
        <Popper open={open} anchorEl={splitButtonRef.current} role='menu' transition disablePortal style={{zIndex: 2}} placement='bottom-end'>
            {({ TransitionProps, placement }) => (
                <Grow
                    {...TransitionProps}
                    style={{
                        transformOrigin: placement === 'bottom' ? 'left top' : 'left bottom',
                    }}
                >
                    <Paper>
                        <ClickAwayListener onClickAway={
                            (event) => {
                                if (splitButtonRef.current?.contains(event.target as HTMLElement)) {
                                    return;
                                }
                                
                                setOpen(false);
                            }
                        }>
                            <MenuList id="split-button-menu">
                                <ListSubheader>Bulk PDFs</ListSubheader>
                                {
                                    [ButtonOptions.DOWNLOAD, ButtonOptions.EXPORT_ALL, ButtonOptions.EXPORT_ALL_NO_SOLUTIONS].map((value) => (
                                        <ExportAllButtonSuboptions 
                                            key={value}
                                            value={value}
                                            buttonState={buttonState}
                                            setOpen={setOpen}
                                            setButtonState={setButtonState}
                                        />
                                    ))
                                }
                                <ListSubheader>Print Single Topics</ListSubheader>
                                {
                                    [ButtonOptions.PRINT_SINGLE, ButtonOptions.PRINT_SINGLE_NO_SOLUTIONS].map((value) => (
                                        <ExportAllButtonSuboptions 
                                            key={value}
                                            value={value}
                                            buttonState={buttonState}
                                            setOpen={setOpen}
                                            setButtonState={setButtonState}
                                        />
                                    ))
                                }
                                <ListSubheader>Print Blank Worksheets</ListSubheader>
                                {
                                    [ButtonOptions.PRINT_BLANK_NO_SOLUTIONS, ButtonOptions.PRINT_BLANK].map((value) => (
                                        <ExportAllButtonSuboptions 
                                            key={value}
                                            value={value}
                                            buttonState={buttonState}
                                            setOpen={setOpen}
                                            setButtonState={setButtonState}
                                        />
                                    ))
                                }
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    </>;
};

export default ExportAllButton;