import React from 'react';
import { FormControlLabel, InputAdornment, Switch, TextField } from '@material-ui/core';
import _ from 'lodash';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import ChipInput from 'material-ui-chip-input';
import { ErrorMessage } from '@hookform/error-message';

/* PROBLEM SETTINGS */
export const ProblemMaxAttempts: React.FC<{}> = () => {
    const { register, errors } = useFormContext();
    const name = 'maxAttempts';

    return (
        <>
            <TextField 
                name={name}
                inputRef={register()} 
                label='Max Graded Attempts'
                type='number'
                inputProps={{min: -1}}
            />
            <ErrorMessage name={name} errors={errors} />
        </>
    );
};

// TODO: Replace with MUI Autocomplete component
export const ProblemPath: React.FC<{}> = () => {
    const { register, errors } = useFormContext();
    const name = 'webworkQuestionPath';

    return (
        <>
            <TextField 
                fullWidth 
                name={name} 
                inputRef={register()} 
                label='Problem Path'
            />
            <ErrorMessage name={name} errors={errors} />
        </>
    );
};

export const ProblemWeight: React.FC<{}> = () => {
    const { register, errors } = useFormContext();
    const name = 'weight';

    return (
        <>
            <TextField 
                name={name} 
                inputRef={register()} 
                label='Weight'
                type='number'
                inputProps={{min: 0}}
            />
            <ErrorMessage name={name} errors={errors} />
        </>
    );
};

export const OptionalField: React.FC<{}> = () => {
    const { control, errors } = useFormContext();
    const name = 'optional';
    
    return (
        <>
            <Controller 
                name={name}
                control={control}
                defaultValue={false}
                render={({ onChange, onBlur, value, name }) => (
                    <FormControlLabel 
                        name='optional'
                        label={'Optional'} 
                        labelPlacement='end'
                        control={
                            <Switch 
                                onBlur={onBlur}
                                onChange={e => onChange(e.target.checked)}
                                color='primary'
                                checked={value}
                                value={value}
                                name={name}
                            />
                        }
                    />
                )} 
            />
            <ErrorMessage name={name} errors={errors} />
        </>
    );
};

const examProblemFieldNamePrefix = 'courseQuestionAssessmentInfo';

export const RandomSeedSet: React.FC<{}> = () => {
    const { control, errors } = useFormContext();
    const name = `${examProblemFieldNamePrefix}.randomSeedSet`;
    const errMsg = errors?.[examProblemFieldNamePrefix]?.randomSeedSet?.message;
    
    return (
        <>
            <Controller
                name={name}
                control={control}
                render={({ onChange, onBlur, value /* name */ }) => (
                    <ChipInput
                        onBlur={onBlur}
                        // Using the value prop turns this into a controlled component, which
                        // would require using onAdd/onDelete instead of onChange.
                        defaultValue={_(value).map(_.toString).uniq().value()}
                        value={_(value).map(_.toString).uniq().value()}
                        onAdd={(chip) => onChange(_.uniq([...value, parseInt(chip, 10)]))}
                        onDelete={(chip) => onChange(_.without(value, parseInt(chip, 10), chip.toString()))}
                        clearInputValueOnChange={true}
                        blurBehavior='add'
                        helperText={errMsg && <span style={{color: 'red'}}>{errMsg}</span>}
                        placeholder='9135, 1534, 447'
                        newChipKeys={['Enter', 'Separator']}
                        newChipKeyCodes={[13, 188]}
                        // We could use this to prevent validation, but it makes it easy to accidentally submit.
                        // TODO: Move HandleSubmit to the submit button to fix accidental submissions?
                        // onBeforeAdd={val => !_.isNaN(_.toNumber(val))}
                    />
                )}
                rules={{
                    required: false,
                    validate: (arr: string[]) => {
                        return _.every(arr, val => !_.isNaN(_.toNumber(val))) || 'All values must be numbers';
                    }
                }}
            />
        </>
    );
};

export const MultipleProblemPaths: React.FC = () => {
    const fieldArrayName = 'additionalProblemPaths';
    const nestedName = `${examProblemFieldNamePrefix}.${fieldArrayName}`;
    const { register, errors } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        name: nestedName
    });

    return (
        <div>
            {fields.map((item, index) => (
                <TextField 
                    key={item.id}
                    fullWidth 
                    name={`${nestedName}[${index}].path`} 
                    InputLabelProps={{shrink: true}}
                    label={`Problem Path ${index + 1}`}
                    defaultValue={`${item.path}`}
                    helperText={errors?.[examProblemFieldNamePrefix]?.[fieldArrayName]?.[index] ? 'Invalid path.' : null}
                    error={!!(errors?.[examProblemFieldNamePrefix]?.[fieldArrayName]?.[index])}
                    inputRef={register({
                        pattern: /^(Library|Contrib|webwork-open-problem-library|private\/our|private\/templates|private\/rederly).*\.pg$/,
                        required: index === 0,
                    })} 
                    onBlur={(e: any)=>{
                        // If the user deleted something and it's not the last field, remove it.
                        if (e.target.value === '' && index !== fields.length - 1) {
                            remove(index);
                        }
                    }}
                    onFocus={()=> {
                        // If the user entered something in the field and it's the last field,
                        // add a new empty field.
                        if (index === fields.length - 1) {
                            append({path: ''}, false);
                        }
                    }}
                />
            ))
            }
        </div>
    );
};

/* EXAM SETTINGS */

const examFieldNamePrefix = 'topicAssessmentInfo';

export const DurationField: React.FC<{}> = () => {
    const { register, errors } = useFormContext();

    return (
        <TextField 
            name={`${examFieldNamePrefix}.duration`}
            InputLabelProps={{ shrink: true }}
            inputRef={register()}
            label={'Time Limit (minutes)'}
            type='number'
            inputProps={{min: 10}}
            InputProps={{
                endAdornment: <InputAdornment position='end'>
                        minutes
                    </InputAdornment>
            }}
        />
    );
};

export const MaxGradedAttemptsPerVersionField: React.FC<{}> = () => {
    const { register, errors } = useFormContext();

    return (
        <TextField 
            name={`${examFieldNamePrefix}.maxGradedAttemptsPerVersion`}
            inputRef={register()}
            label={'Number of Attempts'}
            type='number'
            InputLabelProps={{style: {width: 'max-content'}, shrink: true}}
        />
    );
};

export const MaxVersionsField: React.FC<{}> = () => {
    const { register, errors } = useFormContext();

    return (
        <TextField 
            name={`${examFieldNamePrefix}.maxVersions`}
            InputLabelProps={{ shrink: true }}
            inputRef={register()}
            label={'Graded Submissions per Attempt'}
            type='number'
        />
    );
};

export const RandomizationDelayField: React.FC<{}> = () => {
    const { register, errors } = useFormContext();

    return (
        <TextField 
            name={`${examFieldNamePrefix}.versionDelay`}
            label={'Delay Between Attempts (minutes)'}
            InputLabelProps={{ shrink: true }}
            inputRef={register()}
            type='number'
        />
    );
};

// Generic Generators

export const GenerateSwitchField: React.FC<{fieldName: string, label: string}> = ({fieldName, label}) => {
    const { control, errors } = useFormContext();
    
    return (
        <Controller 
            name={`${examFieldNamePrefix}.${fieldName}`}
            control={control} 
            defaultValue={false}
            render={({ onChange, onBlur, value, name }) => (
                <FormControlLabel
                    // label={_.startCase(fieldName)}
                    label={label}
                    labelPlacement='end'
                    control={<Switch 
                        onBlur={onBlur}
                        onChange={e => onChange(e.target.checked)}
                        color='primary'
                        checked={value}
                        value={value}
                        name={name}
                    />}
                />
            )}
        />
    );
};
