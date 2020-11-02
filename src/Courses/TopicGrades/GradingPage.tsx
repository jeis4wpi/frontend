import { Button, Grid } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Row, Col } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import logger from '../../Utilities/Logger';
import MaterialBiSelect from '../../Components/MaterialBiSelect';
import { useCourseContext } from '../CourseProvider';
import { UserObject, TopicObject, ProblemObject, StudentWorkbookInterface, ProblemDict, StudentGradeDict, StudentGrade } from '../CourseInterfaces';
import ProblemIframe from '../../Assignments/ProblemIframe';
import { getAssessmentProblemsWithWorkbooks } from '../../APIInterfaces/BackendAPI/Requests/CourseRequests';
import { GradeInfoHeader } from './GradeInfoHeader';
import { useQuery } from '../../Hooks/UseQuery';
import AttachmentsPreview from './AttachmentsPreview';

interface TopicGradingPageProps {
    topicId?: string;
    courseId?: string;
}

export const TopicGradingPage: React.FC<TopicGradingPageProps> = () => {
    enum Pin {
        STUDENT,
        PROBLEM
    } 
    const params = useParams<TopicGradingPageProps>();
    const {users} = useCourseContext();
    const qs = useQuery();
    const [error, setError] = useState<string | null>(null);
    const [problemMap, setProblemMap] = useState<Record<number, ProblemDict>>({});
    const [gradeOverride, setGradeOverride] = useState<Partial<StudentGrade>>({});
    const [isPinned, setIsPinned] = useState<Pin | null>(null); // pin one or the other, not both
    const [topic, setTopic] = useState<TopicObject | null>(null);
    const [problems, setProblems] = useState<ProblemObject[] | null>(null);
    const [selected, setSelected] = useState<{
        problem?: ProblemObject, 
        user?: UserObject,
        workbook?: StudentWorkbookInterface,
    }>({});
    const [selectedInfo, setSelectedInfo] = useState<{
        path?: string,
        seed?: number,
        grade?: StudentGradeDict,
        problem?: ProblemObject,
        workbooks?: Record<number, StudentWorkbookInterface>,
        workbook?: StudentWorkbookInterface,
    }>({});

    useEffect(() => {
        logger.debug('GradingPage: topicId changed');
        (async () => {
            try {
                if (_.isNil(params.topicId)) {
                    logger.error('topicId is null');
                    throw new Error('An unexpected error has occurred');
                } else {
                    await fetchProblems(parseInt(params.topicId, 10));
                }
            } catch (e) {
                logger.error(e.message, e);
            }
        })();
    }, [params.topicId, users]);

    useEffect(() => {
        logger.debug('GradingPage: different user or problem was selected');
        // when user and problem are selected - set the available workbooks and 
        // pick one workbook as the default for rendering
        // TODO: adjust for different policies -- best individual / best attempt
        let currentPath: string | undefined;
        let currentSeed: number | undefined;
        let currentUserGrade: StudentGradeDict | undefined;
        let currentWorkbooks: Record<number, StudentWorkbookInterface> | undefined;
        let currentWorkbook: StudentWorkbookInterface | undefined;
        
        if (!_.isNil(selected.problem) && !_.isNil(selected.user)) {
            if (!_.isNil(selected.problem.webworkQuestionPath)) {
                currentPath = selected.problem.webworkQuestionPath;
            } 
            if (!_.isNil(selected.problem.id) && !_.isNil(selected.user.id)) {
                const problemDict = problemMap[selected.problem.id];
                if (!_.isNil(problemDict.grades)) {
                    currentUserGrade = problemDict.grades[selected.user.id];
                    if (!_.isNil(currentUserGrade.randomSeed)) {
                        currentSeed = currentUserGrade.randomSeed;
                    }
                    const currentWorkbooks = currentUserGrade.workbooks;
                    let selectedWorkbookId = currentUserGrade.lastInfluencingAttemptId; // this can be expanded
                    if (!_.isNil(currentWorkbooks) && (!_.isEmpty(currentWorkbooks))) {
                        if (!_.isNil(selectedWorkbookId)) {
                            currentWorkbook = currentWorkbooks[selectedWorkbookId];
                            if (_.isNil(currentWorkbook)) {
                                logger.error(`we were supposed to get workbook #${selectedWorkbookId}, but failed.`);
                            } else {
                                // stop the iframe from rendering using "preview" information
                                currentPath = undefined;
                                currentSeed = undefined;
                            }
                        } else {
                            logger.warn(`Student #${selected.user.id} has bad workbook history for problem #${selected.problem.id} -- selecting the most recent instead.`);
                            selectedWorkbookId = parseInt(_.keys(currentWorkbooks).sort().reverse()[0], 10);
                            currentWorkbook = currentWorkbooks[selectedWorkbookId];
                            if (_.isNil(selectedWorkbookId) || _.isNil(currentWorkbook)) {
                                logger.error(`Student #${selected.user.id} has workbooks for problem #${selected.problem.id} but we failed to ID any of them.`);
                                setError(`There is a problem with the history of submissions for ${selected.user.name}.`);
                            } else {
                                currentPath = undefined;
                                currentSeed = undefined;
                            }
                        }
                    } else {
                        // no error - student simply has no workbooks
                        logger.info('student has no workbooks for this problem');
                    }
                } else {
                    logger.error('TSNH: It is a problem with NO grades?!');
                    setError(`Something went wrong with the grades for problem #${selected.problem.id}.`);
                }
            } else {
                logger.error('TSNH: User and problem are selected, but one is missing an id!');
                setError('The grades information for this topic did not load properly. Please refresh the page.');
            }
            logger.debug(`GradingPage: setting "selectedInfo" workbook: ${currentWorkbook?.id} or preview path: ${currentPath}`);
            setSelectedInfo({
                path: currentPath,
                seed: currentSeed,
                problem: selected.problem,
                grade: currentUserGrade,
                workbooks: currentWorkbooks,
                workbook: currentWorkbook,
            });
            // setSelected({...selected, workbook: currentWorkbook});
        }
    }, [selected.problem, selected.user]);

    useEffect(() => {
        logger.debug(`GradingPage: "selected" workbook is changing: ${selected.workbook?.id}, selectedInfo: ${selectedInfo.workbook?.id}`);
        if (_.isNil(selected.workbook)) {
            const currentPath = selectedInfo.problem?.webworkQuestionPath;
            const currentSeed = selectedInfo.grade?.randomSeed;
            setSelectedInfo({
                path: currentPath,
                seed: currentSeed,
                problem: selected.problem,
                grade: selectedInfo.grade,
                workbooks: selectedInfo.workbooks,
            });
        } else {
            setSelectedInfo({
                problem: selected.problem,
                grade: selectedInfo.grade,
                workbooks: selectedInfo.workbooks,
                workbook: selected.workbook,
            });
        }
    }, [selected.workbook]);

    useEffect(() => {
        logger.debug('GradingPage: overriding grade', gradeOverride.effectiveScore);
        let currentMap = problemMap;
        if (!_.isNil(selectedInfo.problem) &&
            !_.isNil(currentMap[selectedInfo.problem.id])
        ) {
            // save our nil-check progress to avoid TS complaints with the following
            let problem = currentMap[selectedInfo.problem.id];
            if (!_.isNil(gradeOverride) &&
                !_.isNil(gradeOverride.effectiveScore) &&
                !_.isNil(problem.grades) &&
                !_.isNil(selected.user) &&
                !_.isNil(problem.grades[selected.user.id])
            ) {
                // edit the relevant problem dictionary
                problem.grades[selected.user.id].effectiveScore = gradeOverride.effectiveScore;
                // and put it back in the map
                currentMap[selectedInfo.problem.id] = problem;
                setProblemMap(currentMap);
            }
        }
    }, [gradeOverride]);

    const fetchProblems = async (topicId: number) => {
        const res = await getAssessmentProblemsWithWorkbooks({ topicId });
        const currentProblems: Array<ProblemObject> = _(res.data.data.problems)
            .map((p) => { return new ProblemObject(p); })
            .sortBy(['problemNumber'],['asc'])
            .value();
        // currentProblems = _.map(currentProblems, (p) => {return new ProblemObject(p);});
        setProblems(currentProblems);

        const currentTopic = res.data.data.topic;
        setTopic(currentTopic);

        if (!_.isEmpty(currentProblems)) {
            // const problemDictionary = deepKeyBy(problems, 'id') as Record<number, ProblemObject>;
            // https://stackoverflow.com/questions/40937961/lodash-keyby-for-multiple-nested-level-arrays
            const problemDictionary = _(currentProblems)
                .map( (obj) => {
                    return _.mapValues(obj, (val) => {
                        if (_.isArray(val)) {
                            return _(val)
                                .map((obj) => {
                                    return _.mapValues(obj, (val) => {
                                        if (_.isArray(val)) {
                                            return _.keyBy(val, 'id'); // workbooks by id
                                        } else {
                                            return val;
                                        }
                                    });
                                })
                                .keyBy('userId') // key grades by user
                                .value();
                        } else {
                            return val;
                        }
                    });
                })
                .keyBy('id')
                .value() as Record<number, ProblemDict>;
            setProblemMap(problemDictionary);

            const problemIdString = qs.get('problemId');
            let initialSelectedProblem: ProblemObject | undefined;

            const userIdString = qs.get('userId');
            let initialSelectedUser: UserObject | undefined;

            if (_.isNil(problemIdString)) {
                const initialSelectedProblemId = _.sortBy(currentProblems, ['problemNumber'], ['asc'])[0].id;
                initialSelectedProblem = problemDictionary[initialSelectedProblemId] as ProblemObject;
            } else {
                const initialSelectedProblemId = parseInt(problemIdString, 10);
                initialSelectedProblem = problemDictionary[initialSelectedProblemId] as ProblemObject;
                logger.debug(`GP: attempting to set intial user #${initialSelectedProblemId}`);
            }
            // if (!_.isEmpty(users)) {
            if (_.isNil(userIdString)) {
                const initialSelectedUserId = _.sortBy(users, ['lastName'], ['desc'])[0].id;
                initialSelectedUser = _.find(users, { 'id': initialSelectedUserId });
            } else {
                const initialSelectedUserId = parseInt(userIdString, 10);
                initialSelectedUser = _.find(users, {'id': initialSelectedUserId});
                logger.debug(`GP: attempting to set intial user #${initialSelectedUserId}`);
            }
            // }
            setSelected({ user: initialSelectedUser, problem: initialSelectedProblem});
        } else { 
            // setError('No problems in this topic.');
        }
    };

    if (!_.isNil(error)) {
        return (
            <h3>{error}</h3>
        );
    }

    return (
        <Grid>
            <Row>
                <Col className='text-left'>
                    <h1>Grading {topic && topic.name}</h1>
                </Col>
            </Row>
            <Grid container spacing={1}>
                <Grid container item md={4}>
                    {problems && users &&
                        <MaterialBiSelect problems={problems} users={users} selected={selected} setSelected={setSelected} />
                    }
                </Grid>
                <Grid container md={8} style={{paddingLeft: '1rem', height: 'min-content'}}>
                    { selectedInfo.grade &&
                        < GradeInfoHeader
                            grade={selectedInfo.grade}
                            workbookId={selectedInfo.workbook?.id}
                            selected={selected}
                            setSelected={setSelected}
                            onSuccess={setGradeOverride}
                        />
                    }
                    <Grid container alignItems='stretch'>
                        {selectedInfo.problem && selected.user && selectedInfo.workbook && selectedInfo.workbook.id && (
                            < ProblemIframe
                                problem={selectedInfo.problem}
                                readonly={true}
                                workbookId={selectedInfo.workbook.id}
                            />
                        )}
                        {selectedInfo.problem && selectedInfo.path && selectedInfo.seed && (
                            < ProblemIframe
                                problem={selectedInfo.problem}
                                readonly={true}
                                previewPath={selectedInfo.path}
                                previewSeed={selectedInfo.seed}
                            />
                        )}
                    </Grid>
                    <Grid container item md={12}>
                        <AttachmentsPreview 
                            gradeId={selected.workbook?.studentGradeId ?? selectedInfo?.grade?.id}
                            gradeInstanceId={selected.workbook?.studentGradeInstanceId}
                            // Workbooks don't seem to be loading in the database right now,
                            // but a professor shouldn't really care about this level. Attachments should show the same for
                            // all attempts, maybe even all versions?
                            // workbookId={selected.workbook?.id} 
                        /> 
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default TopicGradingPage;