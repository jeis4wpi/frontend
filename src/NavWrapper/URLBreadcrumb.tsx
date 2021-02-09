import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb } from 'react-bootstrap';
import {default as MaterialLink} from '@material-ui/core/Link';
import _ from 'lodash';

interface URLBreadcrumbProps {

}

export const URLBreadcrumb: React.FC<URLBreadcrumbProps> = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    const mappings:  { [key: string]: string; } = {
        'common': 'Home',
        'courses': 'Course',
        'topic': 'Topic',
        'new': 'New Course',
        'edit': 'Customize Curriculum',
        'problem-browser': 'Problem Browser',
        'search': 'Search',
        'editor': 'Editor'
    };

    const noIdFields = ['editor', 'search', 'problem-browser'];

    const genStatefulCrumbs = () => {
        const arr: JSX.Element[] = [];
        for (let i = 0; i < pathnames.length; ++i) {
            const p: string = pathnames[i];
            const m: string = mappings[p];

            // The home page and any other unaccounted for pages should just be ignored for now.
            if (p === 'common' || _.isEmpty(m)) {
                continue;
            }

            // If the next part of the path isn't a number, ignore this path portion
            // and use the next one for the crumb.
            if (p === 'courses' && ((i === pathnames.length - 1) || isNaN(parseInt(pathnames[i+1], 10)))) {
                continue;
            }

            if (noIdFields.indexOf(p) < 0) {
                // Increment to get the ID in the URL.
                ++i;
            }

            const to = `/${pathnames.slice(0, i + 1).join('/')}`;
            arr.push((<span key={`Span${to}`} style={{padding: '0em 1em 0em 1em' }}>/</span>));
            arr.push((
                <MaterialLink key={`Link${to}`} component={Link} to={to}>
                    {/* {pathnames[i] ? `${m} ${pathnames[i]}` : m} */}
                    {m}
                </MaterialLink>
            ));
        }
        return arr;
    };

    return (
        <Breadcrumb aria-label='breadcrumb'>
            <MaterialLink key='Link/common/courses' component={Link} to='/common/courses'>
                My Courses
            </MaterialLink>
            { genStatefulCrumbs() }
        </Breadcrumb>
    );
};

export default URLBreadcrumb;