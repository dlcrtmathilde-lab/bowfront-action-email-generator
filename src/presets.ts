export interface Preset {
  id: string;
  name: string;
  badge: string;
  description: string;
  meetingDate: string;
  todayDate: string;
  notes: string;
  keyVerifications: string[];
}

export const ACCEPTANCE_PRESETS: Preset[] = [
  {
    id: 'test-1-oct20',
    name: 'Acceptance 1: Normal (Oct 20)',
    badge: '6 tasks • Past Due • TBD',
    description: 'All 6 tasks, sorted chronologically, past-due flagged, TBD with open question.',
    meetingDate: 'Tuesday, Oct 20, 2026',
    todayDate: 'Thursday, Oct 29, 2026',
    keyVerifications: [
      'Extracts exactly 6 tasks',
      'Flags past-due task (due Mon, Oct 19 ⚠️ past due)',
      'Identifies missing owner (TBD:) and missing deadline (Due TBD)',
      'Generates open questions for each TBD',
      'Tasks sorted earliest first, TBD last',
      'No absentee line (no one noted absent)',
    ],
    notes: `Bowfront Creative - Weekly Team Sync
Date: Tuesday, Oct 20, 2026
Attendees: Priya, Dana, Marcus, Jen, Theo
Absent: None

Discussion & Tasks:
- Jen: Finalize copy deck for Kettle & Crumb fall campaign - due yesterday (Mon, Oct 19)
- Dana: QA testing on Foothills Physio booking portal - due tomorrow (Wed, Oct 21)
- Marcus: Deliver revised branding guidelines for Kettle & Crumb - due Friday (Oct 23)
- Priya: Review social media assets - deadline was not discussed
- Theo: Send monthly performance metrics - due next Tuesday (Oct 27)
- Someone needs to update the staging environment SSL certificates - due tomorrow (Wed, Oct 21)

Other:
- Remember to submit timesheets before Friday 5 PM.
Next meeting: Tuesday, Oct 27 at 10:00 AM`,
  },
  {
    id: 'test-2-oct13',
    name: 'Acceptance 2: Normal (Oct 13)',
    badge: '4 tasks • Theo & Priya • No absentee',
    description: '4 tasks, dual-owner "Theo & Priya", strictly no absentee sentence.',
    meetingDate: 'Tuesday, Oct 13, 2026',
    todayDate: 'Thursday, Oct 29, 2026',
    keyVerifications: [
      'Extracts exactly 4 tasks',
      'Correctly combines "Theo & Priya:" as owner',
      'No absentee line added (attendees listed, but no one marked absent)',
      'Relative dates correctly calculated (Fri Oct 16, Mon Oct 19, etc.)',
      'Client names kept intact: Kettle & Crumb, Foothills Physio',
    ],
    notes: `Bowfront Weekly Meeting
Date: Tuesday, Oct 13, 2026
Attendees: Priya, Dana, Marcus, Jen, Theo, Riley

Notes:
- Theo & Priya: Co-design wireframes for Kettle & Crumb e-commerce redesign. Due Friday (Oct 16)
- Marcus: Prepare pitch deck for Foothills Physio winter campaign. Due Monday, Oct 19
- Jen: Draft email newsletter sequence for Foothills Physio. Due Thursday, Oct 15
- Dana: Audit tracking pixels on Kettle & Crumb Shopify store. Due Wednesday, Oct 14

Reminders:
- Agency retreat RSVP closes Friday.
Next meeting: Tuesday, Oct 20 at 10am`,
  },
  {
    id: 'test-3-oct6',
    name: 'Acceptance 3: Normal (Oct 6)',
    badge: 'Marcus absent • "end of next week" = Fri, Oct 16',
    description: 'Marcus named absent, relative date "end of next week" converts to Fri, Oct 16, Priya Due TBD.',
    meetingDate: 'Tuesday, Oct 6, 2026',
    todayDate: 'Thursday, Oct 29, 2026',
    keyVerifications: [
      'Includes absentee greeting: "Marcus, adding you since you were out."',
      '"end of next week" resolved accurately to Fri, Oct 16',
      'Priya has missing deadline -> "Due TBD"',
      'Open question generated specifically for Priya\'s missing deadline',
      'Next meeting included as Tue, Oct 13 at 10:00 AM',
    ],
    notes: `Bowfront Creative Weekly Sync
Tuesday, Oct 6, 2026
Attendees: Priya, Dana, Jen, Theo
Absent: Marcus (client shoot in Banff)

Action items:
- Jen: Complete SEO keyword mapping for Foothills Physio. Due Friday (Oct 9)
- Dana: Review Kettle & Crumb autumn menu collateral. Due end of next week
- Priya: Draft influencer contract templates. (Didn't set a date)
- Theo: Setup Google Analytics 4 conversion events for Foothills Physio. Due Tuesday, Oct 13

Next meeting: Tuesday, Oct 13 at 10:00 AM`,
  },
  {
    id: 'test-4-initials',
    name: 'Acceptance 4: Messy Initials',
    badge: 'Initials to Full Names • Theo absent • Vague dates',
    description: 'Replaces P, D, M, J, T, R with full names, detects Theo absent, converts vague dates to TBD.',
    meetingDate: 'Tuesday, Oct 27, 2026',
    todayDate: 'Thursday, Oct 29, 2026',
    keyVerifications: [
      'Replaces all initials with full names (Priya, Dana, Marcus, Jen, Theo, Riley)',
      'Detects "T absent (sick)" and includes Theo in absentee line',
      'Vague dates ("asap sometime soon") set to "Due TBD"',
      'Missing owner ("owner not set") set to "TBD:"',
      'Open questions for each TBD item',
      'No next meeting specified -> "Next meeting: TBD"',
      'Nothing invented beyond the notes',
    ],
    notes: `team sync oct 27, 2026
in: P, D, M, J, R
T absent (sick)

- P: finalize Kettle & Crumb photoshoot schedule. need this by fri (Oct 30)
- D: test staging links for Foothills Physio - due tomorrow (Wed, Oct 28)
- M: send invoice to Foothills Physio. due asap sometime soon
- J: upload assets to client drive for Kettle & Crumb. by thursday (Oct 29)
- staging server reboot needed, owner not set. due wed (Oct 28)
- R: review video cuts. due nov 3

next mtg not sure`,
  },
  {
    id: 'test-5-empty',
    name: 'Acceptance 5: No Notes Given',
    badge: 'Zero Hallucination • Prompt for Notes',
    description: 'Empty notes test: App asks for notes and refuses to invent an email.',
    meetingDate: '',
    todayDate: 'Thursday, Oct 29, 2026',
    keyVerifications: [
      'Does NOT invent an email or dummy tasks',
      'Politely prompts the user to paste or upload meeting notes',
      'Clear, helpful guidance on what information is required',
    ],
    notes: '',
  },
];
