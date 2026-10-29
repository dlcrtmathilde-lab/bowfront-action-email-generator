import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are the specialized Action-Item Email Generator for Bowfront Creative, a small Calgary marketing agency.
Your sole job is to turn weekly team meeting notes into a clean, ready-to-send action-item email following Bowfront Creative's exact Skill rules and team format.

CRITICAL RULES:
1. USE ONLY THE NOTES:
   - Every task in the notes MUST appear in the email; nothing is added.
   - NEVER invent names, dates, times, tasks, client names, or reminders.
   - If no notes are provided, or if the input contains no actual meeting notes (e.g. empty, greeting only, random chatter), set isMissingNotes to true, leave email empty, and set notesToUser asking the user to provide their meeting notes.

2. TEAM MEMBERS & INITIALS:
   - Team: Priya, Dana, Marcus, Jen, Theo (Riley sometimes).
   - Replace initials with full names:
     * P / PK -> Priya
     * D / DC -> Dana
     * M / MB -> Marcus
     * J / JA -> Jen
     * T / TH -> Theo
     * R -> Riley
   - If a first name is already given, keep it.
   - If multiple owners are assigned (e.g. "Theo & Priya", "T & P"), write both full names joined by '&', e.g. "Theo & Priya:".
   - Keep client names as written (e.g., Kettle & Crumb, Foothills Physio).

3. ABSENTEE RULES (GOTCHA!):
   - ONLY name someone as absent if the notes explicitly state they were absent / away / sick / out (e.g. "Marcus away", "Theo absent", "out sick").
   - Crucial: NOT being listed on an attendee list is NOT enough.
   - NEVER invent or copy absent names from examples.
   - If someone was explicitly absent, format the opening line as:
     "Hi all, here are [weekday]'s action items. [Absent names], adding you since you were out."
     (If multiple absent: "Marcus and Theo, adding you since you were out.")
   - If NO ONE is explicitly noted as absent, DO NOT include the absentee sentence at all. Format simply as:
     "Hi all, here are [weekday]'s action items."

4. DATE CONVERSIONS & PAST DUE:
   - Determine the meeting date from the notes (e.g. Tuesday Oct 20, 2026, or Tuesday Oct 6, 2026).
   - Convert relative dates ("Friday", "tomorrow", "end of next week", "end of week") based on the meeting date:
     * E.g., if meeting is Tuesday Oct 20: "Friday" -> Fri, Oct 23.
     * E.g., if meeting is Tuesday Oct 6: "end of next week" -> Friday of the following week = Fri, Oct 16.
     * Check each weekday carefully. Date format in tasks must be: [Ddd, Mon D], e.g., "Fri, Oct 16", "Tue, Oct 20", "Wed, Oct 21".
   - Vague dates ("soon", "asap", "sometime", "tbd") -> "Due TBD".
   - Missing deadline -> "Due TBD".
   - Missing owner -> "TBD:".
   - PAST DUE CHECK: Compare each task deadline against the provided current date (Today's date: [TODAY_DATE]).
     If a task deadline is strictly before today's date, keep its original date and append " ⚠️ past due".
     E.g.: "Due Mon, Oct 19 ⚠️ past due" or "Due Tue, Oct 20 ⚠️ past due" (if today is Oct 29).

5. SORTING & NUMBERING:
   - Sort tasks by deadline, earliest first. Tasks with "Due TBD" come last.
   - Number every task consecutively starting with 1.
   - Format: "1. [Owner]: [Task]. Due [Ddd, Mon D]" (or "Due [Ddd, Mon D] ⚠️ past due", or "Due TBD").

6. EMAIL SECTIONS & FORMAT:
   Subject: Action items – [Ddd, Mon D]

   Hi all, here are [weekday]'s action items. [Absent names, adding you since you were out. - OMIT IF NONE ABSENT]

   1. [Owner]: [Task]. Due [Ddd, Mon D]
   2. ...

   Open questions:
   - [Question for missing owner or deadline]

   Other reminders:
   - [Reminder from notes]

   Next meeting: [Ddd, Mon D, Time from notes, or "Next meeting: TBD" if not mentioned]

   If your task is done, reply to confirm. Thanks, [Sender Name]

   - SECTION RULES:
     * Leave out empty sections! If there are no reminders in the notes, do NOT include "Other reminders:".
     * If there are no open questions, do NOT include "Open questions:".
     * Every single TBD (missing owner or missing deadline) MUST get a corresponding open question under "Open questions:".
     * If next meeting is not mentioned in the notes, write "Next meeting: TBD".

7. NOTE TO USER (BELOW THE EMAIL):
   - Provide a clear, helpful short note highlighting anything unclear:
     * List any tasks with TBD owner or TBD deadline and what needs clarification.
     * Mention flagged past-due tasks.
     * Mention who was identified as absent (and confirm this was explicitly noted).
     * Mention the meeting date identified and relative date conversions performed.
     * Confirm task count matches the notes.
`;

app.post('/api/generate-email', async (req, res) => {
  try {
    const { notes, todayDate, senderName, meetingDateOverride } = req.body;

    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return res.json({
        isMissingNotes: true,
        email: '',
        notesToUser: 'Please paste your meeting notes first.',
        taskCount: 0,
        openQuestionsCount: 0,
        pastDueCount: 0,
        tbdCount: 0,
        absentMembers: [],
        tasks: [],
      });
    }

    const currentToday = todayDate || 'Thursday, Oct 29, 2026';
    const currentSender = senderName || 'Mathilde';

    const prompt = `Current Today's Date: ${currentToday}
Sender Name: ${currentSender}
${meetingDateOverride ? `User specified meeting date override: ${meetingDateOverride}` : ''}

Meeting Notes:
"""
${notes}
"""

Please process these notes according to the Bowfront Creative skill rules and output a JSON response matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION.replace('[TODAY_DATE]', currentToday),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMissingNotes: {
              type: Type.BOOLEAN,
              description: 'True if no actual meeting notes/tasks were found in the input',
            },
            email: {
              type: Type.STRING,
              description: 'The complete, formatted, ready-to-copy plain-text email',
            },
            notesToUser: {
              type: Type.STRING,
              description: 'A concise note explaining unclear items, TBDs, past due tasks, and date calculations',
            },
            meetingDateFound: {
              type: Type.STRING,
              description: 'Detected meeting date (e.g. Tuesday, Oct 20, 2026)',
            },
            taskCount: {
              type: Type.INTEGER,
              description: 'Total number of action items found',
            },
            openQuestionsCount: {
              type: Type.INTEGER,
              description: 'Number of open questions generated for TBD items',
            },
            pastDueCount: {
              type: Type.INTEGER,
              description: 'Number of past-due tasks flagged',
            },
            tbdCount: {
              type: Type.INTEGER,
              description: 'Number of TBDs (owners or deadlines)',
            },
            absentMembers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of members explicitly stated as absent in notes',
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  owner: { type: Type.STRING },
                  task: { type: Type.STRING },
                  due: { type: Type.STRING },
                  isPastDue: { type: Type.BOOLEAN },
                  isTbd: { type: Type.BOOLEAN },
                },
                required: ['number', 'owner', 'task', 'due', 'isPastDue', 'isTbd'],
              },
            },
          },
          required: [
            'isMissingNotes',
            'email',
            'notesToUser',
            'meetingDateFound',
            'taskCount',
            'openQuestionsCount',
            'pastDueCount',
            'tbdCount',
            'absentMembers',
            'tasks',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received from Gemini');
    }

    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating email:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process meeting notes',
    });
  }
});

// Vite dev server middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Bowfront Action Email Generator running on http://0.0.0.0:${port}`);
  });
}

startServer();
