import React, { useRef, useEffect, useState } from 'react';
import { ProblemObject } from '../Courses/CourseInterfaces';
import AxiosRequest from '../Hooks/AxiosRequest';
import _ from 'lodash';
import { Spinner } from 'react-bootstrap';
import * as qs from 'querystring';
import { postQuestionSubmission, putQuestionGrade } from '../APIInterfaces/BackendAPI/Requests/CourseRequests';
import moment from 'moment';
import { useCurrentProblemState } from '../Contexts/CurrentProblemState';
import { xRayVision } from '../Utilities/NakedPromise';
import IframeResizer, { IFrameComponent } from 'iframe-resizer-react';

interface ProblemIframeProps {
    problem: ProblemObject;
    setProblemStudentGrade: (val: any) => void;
    workbookId?: number;
    readonly?: boolean;
}

/**
 * The most important part- rendering the problem.
 * We used the document.write strategy before for backwards compatibility, but modern browsers now block it.
 * We _could_ also set the form to just render the URL directly from the server, but this provides more flexibility
 * with further work on the JSON data.
 * Important reference: https://medium.com/the-thinkmill/how-to-safely-inject-html-in-react-using-an-iframe-adc775d458bc
 */
export const ProblemIframe: React.FC<ProblemIframeProps> = ({
    problem,
    setProblemStudentGrade,
    workbookId,
    readonly = false,
}) => {
    const iframeRef = useRef<IFrameComponent>(null);
    const [renderedHTML, setRenderedHTML] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastSubmission, setLastSubmission] = useState({});
    const height = '100vh';

    const { setLastSavedAt, setLastSubmittedAt } = useCurrentProblemState();

    useEffect(()=>{
        // We need to reset the error state since a new call means no error
        setError('');
        // If you don't reset the rendered html you won't get the load event
        // Thus if you go to an error state and back to the success state
        // The rendered html will never call load handler which will never stop loading
        setRenderedHTML('');
        // srcdoc='' triggers onLoad with setLoading(false) so setLoading(true) isn't effective until now
        setLoading(true); 
        (async () => {
            try {
                let queryString = qs.stringify(_({
                    workbookId,
                    readonly
                }).omitBy(_.isUndefined).value());
                if (!_.isEmpty(queryString)) {
                    queryString = `?${queryString}`;
                }
                const res = await AxiosRequest.get(`/courses/question/${problem.id}${queryString}`);
                // TODO: Error handling.
                setRenderedHTML(res.data.data.rendererData.renderedHTML);
            } catch (e) {
                setError(e.message);
                console.error(e);
                setLoading(false);
            }
        })();
        // when problem changes, reset lastsubmitted and lastsaved
        setLastSubmittedAt?.(null);
        setLastSavedAt?.(null);
        setLastSubmission({});
        updateSubmitActive();
    }, [problem.id]);

    const updateSubmitActive = _.throttle(() => {
        const submitButtons = iframeRef.current?.contentWindow?.document.getElementsByName('submitAnswers') as NodeListOf<HTMLButtonElement>;
        const problemForm = iframeRef.current?.contentWindow?.document.getElementById('problemMainForm') as HTMLFormElement;
        // shouldn't happen - called only onLoad or after interaction with already loaded srcdoc
        // console.error()?
        if (_.isNil(submitButtons) || _.isNil(problemForm)) { return; }

        const isClean = _.isEqual(formDataToObject(new FormData(problemForm)), lastSubmission);

        submitButtons.forEach((button: HTMLButtonElement) => {
            if (isClean) {
                button.disabled = true;
                // invisibly stash the button's label (in case there are multiple submit buttons)
                button.textContent = button.value;
                button.value = 'Submitted';
            } else {
                button.removeAttribute('disabled');
                if (!_.isNil(button.textContent) && button.textContent != '') {
                    // put it back and clear the stash - just in case
                    button.value = button.textContent;
                    button.textContent = '';
                }
            }
        });
    }, 1000, {leading:true, trailing:true});

    const formDataToObject = (formData: FormData) => {
        let object:any = {};
        // downstream iterator error
        // @ts-ignore
        for(let pair of formData.entries()) {
            if (_.isUndefined(object[pair[0]])) {
                object[pair[0]] = pair[1];
            } else {
                if(!_.isArray(object[pair[0]])) {
                    object[pair[0]] = [object[pair[0]]];
                }
                object[pair[0]].push(pair[1]);
            }
        }
        return object;
    };

    async function prepareAndSubmit(problemForm: HTMLFormElement, clickedButton?: HTMLButtonElement) {
        const submitAction = (window as any).submitAction;
        if(typeof submitAction === 'function') submitAction(); // this is a global function from renderer - prepares form field for submit

        let formData = new FormData(problemForm);
        if (!_.isNil(clickedButton)) {
            // current state will never match submission unless we save it before including clickedButton
            setLastSubmission(formDataToObject(formData)); 
            formData.set(clickedButton.name, clickedButton.value);
            try {
                const result = await postQuestionSubmission({
                    id: problem.id,
                    data: formData,
                });
                if(_.isNil(iframeRef?.current)) {
                    console.error('Hijacker: Could not find the iframe ref');
                    setError('An error occurred');
                    return;
                }
                setRenderedHTML(result.data.data.rendererData.renderedHTML);
                if (clickedButton.name === 'submitAnswers'){
                    setProblemStudentGrade(result.data.data.studentGrade);
                    setLastSubmittedAt?.(moment());
                }
            } catch (e) {
                setError(e.message);
                return;
            }
        } else {
            if (_.isNil(problem.grades)) {return;} // TODO: impossi-log console.error()
            if (_.isNil(problem.grades[0])) {return;} // not enrolled - do not save
            if (_.isNil(problem.grades[0].id)) {
                // TODO: impossi-log console.error()
                setError(`No grades id for problem #${problem.id}`);
                return;
            }
            const reqBody = {
                currentProblemState: formDataToObject(formData)
            };
            try {
                const result = await putQuestionGrade({
                    id: problem.grades[0].id, 
                    data: reqBody
                });
                if (result.data.data.updatesCount > 0) {
                    setLastSavedAt?.(moment());
                }
            } catch (e) {
                setError(e.message);
                return;
            }
        }
    }

    function insertListeners(problemForm: HTMLFormElement) {
        const throttledSubmitHandler = _.throttle(prepareAndSubmit, 2000, { leading: true, trailing: true });
        const debouncedSubmitHandler = _.debounce(prepareAndSubmit, 2000, { leading: false, trailing: true });

        // submission of problems will trigger updateSubmitActive @onLoad
        // because re-submission of identical answers is blocked, we expect srcdoc to change
        // even if our assumption fails, 'actual' submission is throttled
        problemForm.addEventListener('submit', (event: { preventDefault: () => void; }) => {
            event.preventDefault();
            const clickedButton = problemForm.querySelector('.btn-clicked') as HTMLButtonElement;
            if (clickedButton.name === 'submitAnswers') {
                // submission is blocked until contents change - throttle will suffice
                throttledSubmitHandler(problemForm, clickedButton);
            } else {
                prepareAndSubmit(problemForm, clickedButton);
            }
        });

        problemForm.addEventListener('input', () => {
            // updating submit button is throttled - so don't worry onInput spam
            updateSubmitActive();
            // we don't want to save while edits are in progress, so debounce
            debouncedSubmitHandler(problemForm);
        });
    }

    const onLoadHandlers = async () => {
        const iframeDoc = iframeRef.current?.contentDocument;
        const iframeWindow = iframeRef?.current?.contentWindow as any | null | undefined;

        if (!iframeDoc) return; // this will prevent empty renderedHTML

        const body = iframeDoc?.body;
        if (body === undefined) {
            console.log('Couldn\'t access body of iframe');
            return;
        }

        let problemForm = iframeWindow?.document.getElementById('problemMainForm') as HTMLFormElement;
        if (!_.isNil(problemForm)) {
            // check that the submit url is accurate
            const submitUrl = problemForm.getAttribute('action');
            const checkId = submitUrl?.match(/\/backend-api\/courses\/question\/([0-9]+)\?/);
            if (checkId && parseInt(checkId[1],10) != problem.id) {
                console.error('Something went wrong. This problem is reporting an ID that is incorrect');
                setError('This problem ID is out of sync.');
                return;
            }
            insertListeners(problemForm);
            updateSubmitActive();
        } else {
            console.error('this problem has no problemMainForm'); // should NEVER happen in WW
        }

        const ww_applet_list = iframeWindow?.ww_applet_list;
        if (!_.isNil(ww_applet_list)) {
    
            const promises = Object.keys(ww_applet_list).map( async (key: string) => {
                const initFunctionName = ww_applet_list[key].onInit;
                // stash original ggbOnInit, then spy on it with a Promise
                const onInitOriginal = iframeWindow?.[initFunctionName];
                const { dressedFunction: dressedInit, nakedPromise } = xRayVision(onInitOriginal);
                iframeWindow[initFunctionName] = dressedInit;

                // getApplet(key) will not resolve until after ggbOnInit runs
                await nakedPromise.promise;

                const {getApplet} = iframeWindow;
                getApplet(key).registerUpdateListener?.(_.debounce(()=>{
                    ww_applet_list[key].submitAction();
                    problemForm.dispatchEvent(new Event('input'));
                },2000));
            }); 
            await Promise.all(promises);       
        }

        setLoading(false);
    };

    return (
        <>
            { loading && <Spinner animation='border' role='status'><span className='sr-only'>Loading...</span></Spinner>}
            {error && <div>{error}</div>}
            <IframeResizer
                // Using onInit instead of ref because:
                // ref never get's set and a warning saying to use `forwardRef` comes up in the console
                // Using forwardRef does not give you access to the iframe, rather it gives you access to 3 or 4 methods and properties (like `sendMessage`)
                onInit={(iframe: IFrameComponent) => {
                    if (iframeRef.current !== iframe) {
                        // TODO do we need to unset the iframeref? As of right now it should not be required since it is always present within the component
                        // If using dom elements the useRef is "Read Only", however I want control!
                        (iframeRef as any).current = iframe;
                        // On first load onLoadHandlers is called before the reference is set
                        onLoadHandlers();
                    } else {
                        // TODO I would like a logging framework that stripped these
                        // console.debug('Reference did not change, do not call on load, that is a workaround for first load anyway');
                    }
                }}
                title='Problem Frame'
                style={{width: '100%', height: height, border: 'none', minHeight: '350px', visibility: (loading || error) ? 'hidden' : 'visible'}}
                sandbox='allow-same-origin allow-forms allow-scripts allow-popups'
                srcDoc={renderedHTML}
                onLoad={onLoadHandlers}
                checkOrigin={false}
                scrolling={false}
            />
        </>
    );
};

export default ProblemIframe;
