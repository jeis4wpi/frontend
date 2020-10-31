import { CreateCourseOptions, PutCourseUnitOptions, PutCourseTopicOptions, PutCourseTopicQuestionOptions, PostCourseTopicQuestionOptions, PostDefFileOptions, DeleteCourseTopicQuestionOptions, DeleteCourseTopicOptions, DeleteCourseUnitOptions, PostCourseUnitOptions, PostCourseTopicOptions, PutCourseOptions, GetQuestionsOptions, PutQuestionGradeOptions, DeleteEnrollmentOptions, PostQuestionSubmissionOptions, ExtendCourseTopicForUser, GetCourseTopicOptions, GetQuestionOptions, ExtendCourseTopicQuestionsForUser, GenerateNewVersionOptions, SubmitVersionOptions, PutQuestionGradeInstanceOptions, EndVersionOptions, PreviewQuestionOptions, getAssessmentProblemsWithWorkbooksOptions, PostConfirmAttachmentUploadOptions, PostEmailProfOptions, ListAttachmentOptions } from '../RequestTypes/CourseRequestTypes';
import * as qs from 'querystring';
import AxiosRequest from '../../../Hooks/AxiosRequest';
import BackendAPIError from '../BackendAPIError';
import { AxiosResponse } from 'axios';
import { CreateCourseResponse, PutCourseUnitUpdatesResponse, PutCourseTopicUpdatesResponse, PutCourseTopicQuestionUpdatesResponse, CreateQuestionResponse, PostDefFileResponse, PostUnitResponse, PostTopicResponse, PutCourseUpdatesResponse, GetQuestionsResponse, PutQuestionGradeResponse, PostQuestionSubmissionResponse, GetTopicResponse, GetQuestionResponse, PutQuestionGradeInstanceResponse, GetUploadURLResponse, PostEmailProfResponse, ListAttachmentsResponse } from '../ResponseTypes/CourseResponseTypes';
import url from 'url';
import { BackendAPIResponse } from '../BackendAPIResponse';
import _ from 'lodash';
import { StudentTopicAssessmentFields } from '../../../Courses/CourseInterfaces';

const COURSE_PATH = '/courses/';
const COURSE_UNIT_PATH = url.resolve(COURSE_PATH, 'unit/');
const COURSE_TOPIC_PATH = url.resolve(COURSE_PATH, 'topic/');
const COURSE_QUESTION_PATH = url.resolve(COURSE_PATH, 'question/');
const COURSE_QUESTION_GRADE_PATH = url.resolve(COURSE_QUESTION_PATH, 'grade/');
const COURSE_QUESTION_INSTANCE_PATH = url.resolve(COURSE_QUESTION_GRADE_PATH, 'instance/');
const COURSE_QUESTIONS_PATH = url.resolve(COURSE_PATH, 'questions/');
const COURSE_DEF_PATH = url.resolve(COURSE_PATH, 'def/');
const COURSE_ENROLL_PATH = url.resolve(COURSE_PATH, 'enroll/');
const COURSE_ASSESS_PATH = url.resolve(COURSE_PATH, 'assessment/');
const COURSE_ATTACHMENTS_PATH = url.resolve(COURSE_PATH, 'attachments/');
const COURSE_ATTACHMENTS_GET_UPLOAD_PATH = url.resolve(COURSE_ATTACHMENTS_PATH, 'upload-url/');
const COURSE_ATTACHMENTS_LIST_PATH = url.resolve(COURSE_ATTACHMENTS_PATH, 'list/');

/* *************** *************** */
/* *********** Courses *********** */
/* *************** *************** */
export const postCourse = async ({
    useCurriculum = true,
    data
}: CreateCourseOptions): Promise<AxiosResponse<CreateCourseResponse>> => {
    try {
        return await AxiosRequest.post(
            url.resolve(
                COURSE_PATH,
                `?${qs.stringify({
                    useCurriculum
                })}`
            ), data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putCourse = async ({
    id,
    data
}: PutCourseOptions): Promise<AxiosResponse<PutCourseUpdatesResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const postEmailProfessor = async ({
    courseId,
    content,
    question
}: PostEmailProfOptions): Promise<AxiosResponse<PostEmailProfResponse>> => {
    return await AxiosRequest.post(
        url.resolve(
            COURSE_PATH,
            `${courseId}/email`
        ),
        {content, question}
    );
};

/* *************** *************** */
/* ************ Units ************ */
/* *************** *************** */
export const postUnit = async ({
    data
}: PostCourseUnitOptions): Promise<AxiosResponse<PostUnitResponse>> => {
    try {
        return await AxiosRequest.post(
            COURSE_UNIT_PATH,
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putUnit = async ({
    id,
    data
}: PutCourseUnitOptions): Promise<AxiosResponse<PutCourseUnitUpdatesResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_UNIT_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const deleteUnit = async ({
    id
}: DeleteCourseUnitOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.delete(
            url.resolve(
                COURSE_UNIT_PATH,
                `${id}/`
            )
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

/* *************** *************** */
/* *********** Topics  *********** */
/* *************** *************** */
export const getTopic = async ({
    id,
    userId,
    includeQuestions
}: GetCourseTopicOptions): Promise<AxiosResponse<GetTopicResponse>> => {
    try {
        return await AxiosRequest.get(
            url.resolve(COURSE_TOPIC_PATH, `${id}?${qs.stringify(_.omitBy({
                userId, 
                includeQuestions
            }, _.isUndefined))}`)
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const postTopic = async ({
    data
}: PostCourseTopicOptions): Promise<AxiosResponse<PostTopicResponse>> => {
    try {
        return await AxiosRequest.post(
            COURSE_TOPIC_PATH,
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putTopic = async ({
    id,
    data
}: PutCourseTopicOptions): Promise<AxiosResponse<PutCourseTopicUpdatesResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_TOPIC_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const deleteTopic = async ({
    id
}: DeleteCourseTopicOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.delete(
            url.resolve(
                COURSE_TOPIC_PATH,
                `${id}/`
            )
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const extendTopic = async ({
    courseTopicContentId,
    userId,
    topicAssessmentInfoId,
    data,
}: ExtendCourseTopicForUser): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_TOPIC_PATH,
                `extend?${qs.stringify(
                    _.omitBy({
                        courseTopicContentId,
                        userId,
                        topicAssessmentInfoId
                    }, _.isUndefined))
                }`
            ), data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

/* *************** *************** */
/* ********** Questions ********** */
/* *************** *************** */
export const postQuestion = async ({
    data
}: PostCourseTopicQuestionOptions): Promise<AxiosResponse<CreateQuestionResponse>> => {
    try {
        return await AxiosRequest.post(
            COURSE_QUESTION_PATH,
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const postQuestionSubmission = async ({
    id,
    data
}: PostQuestionSubmissionOptions): Promise<AxiosResponse<PostQuestionSubmissionResponse>> => {
    try {
        return await AxiosRequest.post(
            url.resolve(
                COURSE_QUESTION_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putQuestion = async ({
    id,
    data
}: PutCourseTopicQuestionOptions): Promise<AxiosResponse<PutCourseTopicQuestionUpdatesResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_QUESTION_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putQuestionGrade = async ({
    id,
    data
}: PutQuestionGradeOptions): Promise<AxiosResponse<PutQuestionGradeResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_QUESTION_GRADE_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const putQuestionGradeInstance = async ({
    id,
    data
}: PutQuestionGradeInstanceOptions): Promise<AxiosResponse<PutQuestionGradeInstanceResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(
                COURSE_QUESTION_INSTANCE_PATH,
                `${id}/`
            ),
            data
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const deleteQuestion = async ({
    id
}: DeleteCourseTopicQuestionOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.delete(
            url.resolve(
                COURSE_QUESTION_PATH,
                `${id}/`
            )
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const postDefFile = async ({
    courseTopicId,
    acceptedFiles
}: PostDefFileOptions): Promise<AxiosResponse<PostDefFileResponse>> => {
    const data = new FormData();
    data.append('def-file', acceptedFiles[0]);

    try {
        return await AxiosRequest.post(
            url.resolve(
                COURSE_DEF_PATH,
                `?${qs.stringify({
                    courseTopicId,
                })}`
            ),
            data,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

// This handles both GET and SUBMIT.
export const postPreviewQuestion = async ({
    webworkQuestionPath,
    problemSeed,
    formData,
}: PreviewQuestionOptions): Promise<AxiosResponse<GetQuestionResponse>> => {
    try {
        return await AxiosRequest.post(
            url.resolve(COURSE_PATH, 'preview'), formData, {
                params: {
                    webworkQuestionPath,
                    problemSeed,
                }
            });
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const getQuestion = async ({
    id, 
    userId
}: GetQuestionOptions): Promise<AxiosResponse<GetQuestionResponse>> => {
    try {
        return await AxiosRequest.get(
            url.resolve(COURSE_QUESTION_PATH, `${id}`), {
                params: {
                    userId,
                }
            });
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const getQuestions = async ({
    userId,
    courseTopicContentId
}: GetQuestionsOptions): Promise<AxiosResponse<GetQuestionsResponse>> => {
    try {
        return await AxiosRequest.get(COURSE_QUESTIONS_PATH, {
            params: {
                userId,
                courseTopicContentId
            }
        });
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const extendQuestion = async ({
    courseTopicQuestionId, 
    userId,
    extensions
}: ExtendCourseTopicQuestionsForUser): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.put(
            url.resolve(COURSE_QUESTION_PATH, `extend?${qs.stringify({courseTopicQuestionId, userId})}`), 
            extensions
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const deleteEnrollment = async ({
    userId, courseId
}: DeleteEnrollmentOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.delete(
            COURSE_ENROLL_PATH,
            {
                data: {
                    userId, courseId
                }
            }
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const generateNewVersion = async ({
    topicId
}: GenerateNewVersionOptions): Promise<AxiosResponse<BackendAPIResponse<StudentTopicAssessmentFields>>> => {
    try {
        return await AxiosRequest.get(
            url.resolve(COURSE_ASSESS_PATH, `topic/${topicId}/start`),
            {
                headers: {
                    /**
                     * Forms send this field in the origin header, however that wasn't coming across with the axios request
                     * Adding `origin` myself was getting stripped
                     * Could not find solution online so used a custom header
                     * Other headers don't work because they get modified by aws (between cloudfront and the load balancers) 
                     */
                    'rederly-origin': window.location.origin,
                }
            }
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const submitVersion = async ({
    topicId,
    versionId
}: SubmitVersionOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.post(
            url.resolve(COURSE_ASSESS_PATH, `topic/${topicId}/submit/${versionId}`)
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const endVersion = async ({
    versionId
}: EndVersionOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.get(
            url.resolve(COURSE_ASSESS_PATH, `topic/end/${versionId}`)
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const getAssessmentProblemsWithWorkbooks = async ({
    topicId
}: getAssessmentProblemsWithWorkbooksOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.get(
            url.resolve(COURSE_ASSESS_PATH, `topic/grade/${topicId}`)
        );
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

/* *************** *************** */
/* ********** Attachments ********** */
/* *************** *************** */

export const getUploadURL = async (): Promise<AxiosResponse<GetUploadURLResponse>> => {
    try {
        return await AxiosRequest.get(COURSE_ATTACHMENTS_GET_UPLOAD_PATH);
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const postConfirmAttachmentUpload = async (options: PostConfirmAttachmentUploadOptions): Promise<AxiosResponse<BackendAPIResponse>> => {
    try {
        return await AxiosRequest.post(COURSE_ATTACHMENTS_PATH, options);
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

// Workbooks is an auditing field and there isn't a practical frontend use for them right now.
export const getAttachments = async ({
    studentGradeId,
    studentGradeInstanceId,
    studentWorkbookId,
}: ListAttachmentOptions): Promise<AxiosResponse<ListAttachmentsResponse>> => {
    try {
        const gradeParams = {
            ...(studentGradeInstanceId ?
                {studentGradeInstanceId: studentGradeInstanceId} :
                {studentGradeId: studentGradeId}
            ),
        }
        const params = studentWorkbookId ? { studentWorkbookId } : gradeParams;
    
        return await AxiosRequest.get(COURSE_ATTACHMENTS_LIST_PATH, {
            params,
        });
    } catch (e) {
        throw new BackendAPIError(e);
    }
};

export const deleteAttachments = async ({
    id
}: {id: number}): Promise<AxiosResponse<any>> => {
    try {
        return await AxiosRequest.delete(url.resolve(COURSE_ATTACHMENTS_PATH, `${id}/`));
    } catch (e) {
        throw new BackendAPIError(e);
    }
};
