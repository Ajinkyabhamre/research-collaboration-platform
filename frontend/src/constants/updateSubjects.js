// UpdateSubject enum values matching the GraphQL schema
export const UPDATE_SUBJECTS = [
  { value: 'CALL_FOR_APPLICANTS', label: 'Call for Applicants' },
  { value: 'TEAM_UPDATE', label: 'Team Update' },
  { value: 'PROJECT_LAUNCH', label: 'Project Launch' },
  { value: 'MILESTONE_REACHED', label: 'Milestone Reached' },
  { value: 'PROGRESS_REPORT', label: 'Progress Report' },
  { value: 'DEADLINE_UPDATE', label: 'Deadline Update' },
  { value: 'REQUEST_FOR_FEEDBACK', label: 'Request for Feedback' },
  { value: 'FUNDING_UPDATE', label: 'Funding Update' },
  { value: 'EVENT_ANNOUNCEMENT', label: 'Event Announcement' },
  { value: 'ISSUE_REPORTED', label: 'Issue Reported' },
  { value: 'PUBLISHED_ANNOUNCEMENT', label: 'Published Announcement' },
  { value: 'FINAL_RESULTS', label: 'Final Results' },
  { value: 'PROJECT_COMPLETION', label: 'Project Completion' },
];

// Helper function to format UpdateSubject enum values for display
export const formatUpdateSubject = (subject) => {
  const found = UPDATE_SUBJECTS.find((s) => s.value === subject);
  return found ? found.label : subject.replace(/_/g, ' ');
};

// Badge variant mapping for different update subjects
export const getSubjectBadgeVariant = (subject) => {
  const variantMap = {
    CALL_FOR_APPLICANTS: 'primary',
    TEAM_UPDATE: 'info',
    PROJECT_LAUNCH: 'success',
    MILESTONE_REACHED: 'success',
    PROGRESS_REPORT: 'info',
    DEADLINE_UPDATE: 'warning',
    REQUEST_FOR_FEEDBACK: 'primary',
    FUNDING_UPDATE: 'success',
    EVENT_ANNOUNCEMENT: 'primary',
    ISSUE_REPORTED: 'danger',
    PUBLISHED_ANNOUNCEMENT: 'success',
    FINAL_RESULTS: 'success',
    PROJECT_COMPLETION: 'success',
  };
  return variantMap[subject] || 'default';
};
