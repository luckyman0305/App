import Onyx from 'react-native-onyx';
import {cleanup} from '@testing-library/react-native';
import lodashGet from 'lodash/get';
import waitForPromisesToResolve from '../utils/waitForPromisesToResolve';
import {LocaleContextProvider} from '../../src/components/withLocalize';

const TEST_MAX_SEQUENCE_NUMBER = 10;

const fakeInsets = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
};

const fakePersonalDetails = {
    'email1@test.com': {
        login: 'email1@test.com',
        displayName: 'Email One',
        avatar: 'none',
        firstName: 'ReportID',
    },
    'email2@test.com': {
        login: 'email2@test.com',
        displayName: 'Email Two',
        avatar: 'none',
        firstName: 'One',
    },
    'email3@test.com': {
        login: 'email3@test.com',
        displayName: 'Email Three',
        avatar: 'none',
        firstName: 'ReportID',
    },
    'email4@test.com': {
        login: 'email4@test.com',
        displayName: 'Email Four',
        avatar: 'none',
        firstName: 'Two',
    },
    'email5@test.com': {
        login: 'email5@test.com',
        displayName: 'Email Five',
        avatar: 'none',
        firstName: 'ReportID',
    },
    'email6@test.com': {
        login: 'email6@test.com',
        displayName: 'Email Six',
        avatar: 'none',
        firstName: 'Three',
    },
    'email7@test.com': {
        login: 'email7@test.com',
        displayName: 'Email Seven',
        avatar: 'none',
        firstName: 'ReportID',
    },
    'email8@test.com': {
        login: 'email8@test.com',
        displayName: 'Email Eight',
        avatar: 'none',
        firstName: 'Four',
    },
    'email9@test.com': {
        login: 'email9@test.com',
        displayName: 'Email Nine',
        avatar: 'none',
        firstName: 'EmailNine',
    },
};

const fakeReport1 = {
    reportID: '1',
    reportName: 'Report One',
    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,

    // This report's last comment will be in the past
    lastMessageTimestamp: Date.now() - 3000,
    participants: ['email1@test.com', 'email2@test.com'],
};
const fakeReport2 = {
    reportID: '2',
    reportName: 'Report Two',
    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastMessageTimestamp: Date.now() - 2000,
    participants: ['email3@test.com', 'email4@test.com'],
};
const fakeReport3 = {
    reportID: '3',
    reportName: 'Report Three',
    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastMessageTimestamp: Date.now() - 1000,
    participants: ['email5@test.com', 'email6@test.com'],
};
const fakeReportIOU = {
    reportID: '4',
    reportName: 'Report IOU Four',
    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
    lastMessageTimestamp: Date.now() - 1000,
    participants: ['email5@test.com', 'email6@test.com'],
    ownerEmail: 'email2@test.com',
    hasOutstandingIOU: true,
    total: 10000,
    currency: 'USD',
};

const fakeReport1Actions = {
    actionName: 'ADDCOMMENT',
    person: [],
    sequenceNumber: 0,

    // This comment will be in the past
    timestamp: Date.now() - 2000,
    message: [
        {type: 'comment', reportID: '1', text: 'Comment One'},
    ],
};
const fakeReport2Actions = {
    actionName: 'ADDCOMMENT',
    person: [],
    sequenceNumber: 0,
    timestamp: Date.now() - 1000,
    message: [
        {type: 'comment', reportID: '2', text: 'Comment Two'},
    ],
};
const fakeReport3Actions = {
    actionName: 'ADDCOMMENT',
    person: [],
    sequenceNumber: 0,
    timestamp: Date.now(),
    message: [
        {type: 'comment', reportID: '2', text: 'Comment Three'},
    ],
};

const ONYXKEYS = {
    PERSONAL_DETAILS: 'personalDetails',
    NVP_PRIORITY_MODE: 'nvp_priorityMode',
    SESSION: 'session',
    BETAS: 'betas',
    COLLECTION: {
        REPORT: 'report_',
        REPORT_ACTIONS: 'reportActions_',
        REPORT_IOUS: 'reportIOUs_',
    },
};

Onyx.init({
    keys: ONYXKEYS,
    registerStorageEventListener: () => {},
});

/**
 * @param {String} [reportIDFromRoute]
 * @returns {RenderAPI}
 */
function getDefaultRenderedSidebarLinks(reportIDFromRoute = '') {
    // An ErrorBoundary needs to be added to the rendering so that any errors that happen while the component
    // renders are logged to the console. Without an error boundary, Jest only reports the error like "The above error
    // occurred in your component", except, there is no "above error". It's just swallowed up by Jest somewhere.
    // With the ErrorBoundary, those errors are caught and logged to the console so you can find exactly which error
    // might be causing a rendering issue when developing tests.
    class ErrorBoundary extends React.Component {
        // Error boundaries have to implement this method. It's for providing a fallback UI, but
        // we don't need that for unit testing, so this is basically a no-op.
        static getDerivedStateFromError(error) {
            return {error};
        }

        componentDidCatch(error, errorInfo) {
            console.error(error, errorInfo);
        }

        render() {
            // eslint-disable-next-line react/prop-types
            return this.props.children;
        }
    }

    // Wrap the SideBarLinks inside of LocaleContextProvider so that all the locale props
    // are passed to the component. If this is not done, then all the locale props are missing
    // and there are a lot of render warnings. It needs to be done like this because normally in
    // our app (App.js) is when the react application is wrapped in the context providers
    return render((
        <LocaleContextProvider>
            <ErrorBoundary>
                <SidebarLinks
                    onLinkClick={() => {}}
                    insets={fakeInsets}
                    onAvatarClick={() => {}}
                    isSmallScreenWidth={false}
                    reportIDFromRoute={reportIDFromRoute}
                />
            </ErrorBoundary>
        </LocaleContextProvider>
    ));
}

describe('Sidebar', () => {
    beforeAll(() => Onyx.init({
        keys: ONYXKEYS,
        registerStorageEventListener: () => {},
    }));

    // Clear out Onyx after each test so that each test starts with a clean slate
    afterEach(() => {
        cleanup();
        Onyx.clear();
    });

    describe('in default mode', () => {
        it('is not rendered when there are no props passed to it', () => {
            // Given all the default props are passed to SidebarLinks
            // When it is rendered
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks();

            // Then it should render nothing and be null
            // This is expected because there is an early return when there are no personal details
            expect(sidebarLinks.toJSON()).toBe(null);
        });

        it('is rendered with an empty list when personal details exist', () => {
            // Given the sidebar is rendered with default props
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks();

            return waitForPromisesToResolve()

                // When Onyx is updated with some personal details
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                }))

                // Then the component should be rendered with an empty list since it will get past the early return
                .then(() => {
                    expect(sidebarLinks.toJSON()).not.toBe(null);
                    expect(sidebarLinks.queryAllByA11yHint('Navigates to a chat')).toHaveLength(0);
                });
        });

        it('contains one report when a report is in Onyx', () => {
            // Given a single report
            const report = LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com']);
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks(report.reportID);

            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report.reportID}`]: report,
                }))

                // Then the component should be rendered with an item for the report
                .then(() => {
                    expect(sidebarLinks.queryAllByText('One, Two')).toHaveLength(1);
                });
        });

        test('orders items with most recently updated on top', () => {
            // Given the sidebar is rendered in default mode (most recent first)
            // while currently viewing report 1
            const sidebarLinks = getDefaultRenderedSidebarLinks('1');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'default',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: fakeReport1,
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: fakeReport2,
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: fakeReport3,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // Then the component should be rendered with the mostly recently updated report first
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Three, Four');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('One, Two');
                });
        });

        it('doesn\'t change the order when adding a draft to the active report', () => {
            // Given three reports in the recently updated order of 3, 2, 1
            // And the first report has a draft
            // And the currently viewed report is the first report
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3),
                hasDraft: true,
            };
            const report2 = LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2);
            const report3 = LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1);
            const reportIDFromRoute = report1.reportID;
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks(reportIDFromRoute);
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // Then there should be a pencil icon and report one should still be the last one because putting a draft on the active report should not change it's location
                // in the ordered list
                .then(() => {
                    const pencilIcon = sidebarLinks.getAllByAccessibilityHint('Pencil Icon');
                    expect(pencilIcon).toHaveLength(1);

                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Three, Four');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('One, Two');
                });
        });

        test('reorders the reports to always have the most recently updated one on top', () => {
            const sidebarLinks = getDefaultRenderedSidebarLinks('1');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'default',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: fakeReport1,
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: fakeReport2,
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: fakeReport3,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // When a new comment is added to report 1 (eg. it's lastMessageTimestamp is updated)
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`, {lastMessageTimestamp: Date.now()}))

                // Then the order of the reports should be 1 > 3 > 2
                //                                         ^--- (1 goes to the front and pushes other two down)
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Three, Four');
                });
        });

        it('reorders the reports to keep draft reports on top', () => {
            // Given three reports in the recently updated order of 3, 2, 1
            // And the second report has a draft
            // And the currently viewed report is the second report
            const report1 = LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3);
            const report2 = {
                ...LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2),
                hasDraft: true,
            };
            const report3 = LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1);
            const reportIDFromRoute = report2.reportID;
            let sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks(reportIDFromRoute);

            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // When the currently active chat is switched to report 1 (the one on the bottom)
                .then(() => {
                    // The changing of a route itself will re-render the component in the App, but since we are not performing this test
                    // inside the navigator and it has no access to the routes we need to trigger an update to the SidebarLinks manually.
                    sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks('1');
                    return waitForPromisesToResolve();
                })

                // Then the order of the reports should be 2 > 3 > 1
                //                                         ^--- (2 goes to the front and pushes 3 down)
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Three, Four');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('One, Two');
                });
        });

        test('removes the pencil icon when draft is removed', () => {
            const sidebarLinks = getDefaultRenderedSidebarLinks('2');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'default',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: fakeReport1,
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: {hasDraft: true, ...fakeReport2},
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: fakeReport3,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // Then there should be a pencil icon showing
                .then(() => {
                    expect(sidebarLinks.getAllByAccessibilityHint('Pencil Icon')).toHaveLength(1);
                })

                // When the draft is removed
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}${report.reportID}`, {hasDraft: null}))

                // Then the pencil icon goes away
                .then(() => {
                    expect(sidebarLinks.queryAllByAccessibilityHint('Pencil Icon')).toHaveLength(0);
                });
        });

        test('removes the pin icon when chat is unpinned', () => {
            const sidebarLinks = getDefaultRenderedSidebarLinks('2');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'default',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: fakeReport1,
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: {...fakeReport2, isPinned: true},
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: fakeReport3,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // Then there should be a pencil icon showing
                .then(() => {
                    expect(sidebarLinks.getAllByAccessibilityHint('Pin Icon')).toHaveLength(1);
                })

                // When the draft is removed
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}${report.reportID}`, {isPinned: false}))

                // Then the pencil icon goes away
                .then(() => {
                    expect(sidebarLinks.queryAllByAccessibilityHint('Pin Icon')).toHaveLength(0);
                });
        });

        it('sorts chats by pinned > IOU > draft', () => {
            // Given three reports in the recently updated order of 3, 2, 1
            // with the current user set to email9@ (someone not participating in any of the chats)
            // with a report that has a draft, a report that is pinned, and
            //    an outstanding IOU report that doesn't belong to the current user
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3),
                isPinned: true,
            };
            const report2 = {
                ...LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2),
                hasDraft: true,
            };
            const report3 = {
                ...LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1),
                hasOutstandingIOU: true,

                // This has to be added after the IOU report is generated
                iouReportID: null,
            };
            const iouReport = {
                ...LHNTestUtils.getFakeReport(['email7@test.com', 'email8@test.com']),
                ownerEmail: 'email2@test.com',
                hasOutstandingIOU: true,
                total: 10000,
                currency: 'USD',
                chatReportID: report3.reportID,
            };
            report3.iouReportID = iouReport.reportID;
            const reportIDFromRoute = report2.reportID;
            const currentlyLoggedInUserEmail = 'email9@test.com';
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks(reportIDFromRoute);

            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [ONYXKEYS.SESSION]: {email: currentlyLoggedInUserEmail},
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                    [`${ONYXKEYS.COLLECTION.REPORT_IOUS}${iouReport.reportID}`]: iouReport,
                }))

                // Then the reports are ordered by Pinned > IOU > Draft
                // there is a pencil icon
                // there is a pinned icon
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(sidebarLinks.getAllByAccessibilityHint('Pin Icon')).toHaveLength(1);
                    expect(sidebarLinks.getAllByAccessibilityHint('Pencil Icon')).toHaveLength(1);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Three, Four');
                });
        });

        it('alphabetizes all the chats that are pinned', () => {
            // Given three reports in the recently updated order of 3, 2, 1
            // and they are all pinned
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3),
                isPinned: true,
            };
            const report2 = {
                ...LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2),
                isPinned: true,
            };
            const report3 = {
                ...LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1),
                isPinned: true,
            };
            const report4 = {
                ...LHNTestUtils.getFakeReport(['email7@test.com', 'email8@test.com'], 0),
                isPinned: true,
            };
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks('0');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // Then the reports are in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Three, Four');
                })

                // When a new report is added
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}4`, {
                    reportID: '4',
                    reportName: 'Report Four',
                    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
                    isPinned: true,
                    lastMessageTimestamp: Date.now(),
                    participants: ['email7@test.com', 'email8@test.com'],
                }))

                // Then they are still in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(4);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Seven, Eight');
                    expect(lodashGet(displayNames, [3, 'props', 'children'])).toBe('Three, Four');
                });
        });

        it('alphabetizes all the chats that have drafts', () => {
            // Given three reports in the recently updated order of 3, 2, 1
            // and they all have drafts
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3),
                hasDraft: true,
            };
            const report2 = {
                ...LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2),
                hasDraft: true,
            };
            const report3 = {
                ...LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1),
                hasDraft: true,
            };
            const report4 = {
                ...LHNTestUtils.getFakeReport(['email7@test.com', 'email8@test.com'], 0),
                hasDraft: true,
            };
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks('0');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // Then the reports are in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Three, Four');
                })

                // When a new report is added
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}4`, {
                    reportID: '4',
                    reportName: 'Report Four',
                    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
                    hasDraft: true,
                    lastMessageTimestamp: Date.now(),
                    participants: ['email7@test.com', 'email8@test.com'],
                }))

                // Then they are still in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(4);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Seven, Eight');
                    expect(lodashGet(displayNames, [3, 'props', 'children'])).toBe('Three, Four');
                });
        });

        it('puts archived chats last', () => {
            // Given three reports, with the first report being archived
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com']),
                chatType: CONST.REPORT.CHAT_TYPE.POLICY_ROOM,
                statusNum: CONST.REPORT.STATUS.CLOSED,
                stateNum: CONST.REPORT.STATE_NUM.SUBMITTED,
            };
            const report2 = LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com']);
            const report3 = LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com']);

            // Given the user is in all betas
            const betas = [
                CONST.BETAS.DEFAULT_ROOMS,
                CONST.BETAS.POLICY_ROOMS,
                CONST.BETAS.POLICY_EXPENSE_CHAT,
            ];
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks('0');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.BETAS]: betas,
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.DEFAULT,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // Then the first report is in last position
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Three, Four');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Report (archived)');
                });
        });
    });

    describe('in #focus mode', () => {
        it('hides unread chats', () => {
            let sidebarLinks = getDefaultRenderedSidebarLinks('1');
            return waitForPromisesToResolve()

                // Given the sidebar is rendered in #focus mode (hides read chats)
                // with report 1 and 2 having unread actions
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'gsd',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: {...fakeReport1, lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1},
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: {...fakeReport2, lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1},
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: fakeReport3,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // Then the reports 1 and 2 are shown and 3 is not
                .then(() => {
                    const reportOptions = sidebarLinks.queryAllByText(/ReportID, /);
                    expect(reportOptions).toHaveLength(2);
                    expect(reportOptions[0].children[0].props.children).toBe('ReportID, One');
                    expect(reportOptions[1].children[0].props.children).toBe('ReportID, Two');
                })

                // When report3 becomes unread
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}3`, {lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1}))

                // Then all three chats are showing
                .then(() => {
                    expect(sidebarLinks.queryAllByText(/ReportID, /)).toHaveLength(3);
                })

                // When report 1 becomes read (it's the active report)
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}1`, {lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER}))

                // Then all three chats are still showing
                .then(() => {
                    expect(sidebarLinks.queryAllByText(/ReportID, /)).toHaveLength(3);
                })

                // When report 2 becomes the active report
                .then(() => {
                    // The changing of a route itself will re-render the component in the App, but since we are not performing this test
                    // inside the navigator and it has no access to the routes we need to trigger an update to the SidebarLinks manually.
                    sidebarLinks = getDefaultRenderedSidebarLinks('2');
                    return waitForPromisesToResolve();
                })

                // Then report 1 should now disappear
                .then(() => {
                    expect(sidebarLinks.queryAllByText(/ReportID, /)).toHaveLength(2);
                    expect(sidebarLinks.queryAllByText(/ReportID, One/)).toHaveLength(0);
                });
        });

        it('alphabetizes chats', () => {
            const sidebarLinks = getDefaultRenderedSidebarLinks('1');
            return waitForPromisesToResolve()

                // Given the sidebar is rendered in #focus mode (hides read chats)
                // with all reports having unread comments
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.NVP_PRIORITY_MODE]: 'gsd',
                    [ONYXKEYS.PERSONAL_DETAILS]: fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}1`]: {...fakeReport1, lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1},
                    [`${ONYXKEYS.COLLECTION.REPORT}2`]: {...fakeReport2, lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1},
                    [`${ONYXKEYS.COLLECTION.REPORT}3`]: {...fakeReport3, lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1},
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}1`]: fakeReport1Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport2Actions,
                    [`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}2`]: fakeReport3Actions,
                }))

                // Then the reports are in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Three, Four');
                })

                // When a new report is added
                .then(() => Onyx.merge(`${ONYXKEYS.COLLECTION.REPORT}4`, {
                    reportID: '4',
                    reportName: 'Report Four',
                    maxSequenceNumber: TEST_MAX_SEQUENCE_NUMBER,
                    lastReadSequenceNumber: TEST_MAX_SEQUENCE_NUMBER - 1,
                    lastMessageTimestamp: Date.now(),
                    participants: ['email7@test.com', 'email8@test.com'],
                }))

                // Then they are still in alphabetical order
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(4);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('One, Two');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Seven, Eight');
                    expect(lodashGet(displayNames, [3, 'props', 'children'])).toBe('Three, Four');
                });
        });

        it('puts archived chats last', () => {
            // Given three unread reports, with the first report being archived
            const report1 = {
                ...LHNTestUtils.getFakeReport(['email1@test.com', 'email2@test.com'], 3),
                lastReadSequenceNumber: LHNTestUtils.TEST_MAX_SEQUENCE_NUMBER - 1,
                chatType: CONST.REPORT.CHAT_TYPE.POLICY_ROOM,
                statusNum: CONST.REPORT.STATUS.CLOSED,
                stateNum: CONST.REPORT.STATE_NUM.SUBMITTED,
            };
            const report2 = {
                ...LHNTestUtils.getFakeReport(['email3@test.com', 'email4@test.com'], 2),
                lastReadSequenceNumber: LHNTestUtils.TEST_MAX_SEQUENCE_NUMBER - 1,
            };
            const report3 = {
                ...LHNTestUtils.getFakeReport(['email5@test.com', 'email6@test.com'], 1),
                lastReadSequenceNumber: LHNTestUtils.TEST_MAX_SEQUENCE_NUMBER - 1,
            };

            // Given the user is in all betas
            const betas = [
                CONST.BETAS.DEFAULT_ROOMS,
                CONST.BETAS.POLICY_ROOMS,
                CONST.BETAS.POLICY_EXPENSE_CHAT,
            ];
            const sidebarLinks = LHNTestUtils.getDefaultRenderedSidebarLinks('0');
            return waitForPromisesToResolve()

                // When Onyx is updated with the data and the sidebar re-renders
                .then(() => Onyx.multiSet({
                    [ONYXKEYS.BETAS]: betas,
                    [ONYXKEYS.NVP_PRIORITY_MODE]: CONST.PRIORITY_MODE.GSD,
                    [ONYXKEYS.PERSONAL_DETAILS]: LHNTestUtils.fakePersonalDetails,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report1.reportID}`]: report1,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report2.reportID}`]: report2,
                    [`${ONYXKEYS.COLLECTION.REPORT}${report3.reportID}`]: report3,
                }))

                // Then the first report is in last position
                .then(() => {
                    const displayNames = sidebarLinks.queryAllByA11yLabel('Chat user display names');
                    expect(displayNames).toHaveLength(3);
                    expect(lodashGet(displayNames, [0, 'props', 'children'])).toBe('Five, Six');
                    expect(lodashGet(displayNames, [1, 'props', 'children'])).toBe('Three, Four');
                    expect(lodashGet(displayNames, [2, 'props', 'children'])).toBe('Report (archived)');
                });
        });
    });
});
