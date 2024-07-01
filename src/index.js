import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import EventHandler from './EventHandler.js';
import FunctionCallingList from './FunctionCallingTool.js';
import { prisma } from './db/index.js';

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
const OPENAPI_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// async function createTechRecruiterAssistant() {
// const assistant = await openai.beta.assistants.create({
//   name: 'Tech Recruiter',
//   instructions: `You are a tech recruiter assistant. You should welcome candidates and get these information about the applicant:
//                   - How many years of experience he or she has
//                   - What is his/her favorite programming language
//                   - Whether or not he/she is willing to program using ruby
//                   - Whether or not he/she is willing to work on-site
//                   - Answer any questions the potential tenant might have about the job post
//                   - When the applicant would like to interview`,
//   tools: [{ type: 'file_search' }],
//   model: 'gpt-4o',
// });
// console.log(assistant);

// const fileStreams = fs.createReadStream(
//   './position-and-company-infrmation.txt',
// );

// // Create a vector store including our two files.
// let vectorStore = await openai.beta.vectorStores.create({
//   name: 'About the position',
// });

// console.log(vectorStore);

//   const res = await openai.beta.vectorStores.fileBatches.uploadAndPoll(
//     'vs_XSk3oE1ExAlP1Dg1kmmrbMI4',
//     { files: [fileStreams] },
//   );

//   return res;
// }

app.get('/', async (req, res) => {
  const result = await FunctionCallingList.saveFavoriteProgrammingLanguage(
    'threadId',
    { favoriteProgrammingLanguage: 'JS' },
  );
  console.log(result);
  res.json(result);
});

app.post('/ask', async (req, res) => {
  const eventHandler = new EventHandler(openai, res);
  eventHandler.on('event', eventHandler.onEvent.bind(eventHandler));
  const { threadId, message } = req.body;
  if (!message) {
    res
      .send({ success: false, message: 'You need to provide a message!' })
      .status(400)
      .end();
  }

  let emptyThreadId;
  if (!threadId) {
    const emptyThread = await openai.beta.threads.create();
    emptyThreadId = emptyThread.id;
  }

  const stream = await openai.beta.threads.runs.create(
    threadId || emptyThreadId,
    {
      assistant_id: ASSISTANT_ID,
      stream: true,
      additional_messages: [{ role: 'user', content: message }],
    },
  );
  await prisma.answers.upsert({
    update: { threadId: threadId || emptyThreadId },
    where: { threadId },
    create: { threadId },
  });
  for await (const event of stream) {
    eventHandler.emit('event', event);
  }
});

app.get('/threads', async (req, res) => {
  const { threadId } = req.body;
  const thread = await openai.beta.threads.retrieve(threadId);
  res.json(thread).end();
});

app.put('/threads/close/:threadId', async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await prisma.answers.update({
      where: { threadId },
      data: { status: 'closed' },
    });
    res.status(200).end();
  } catch (error) {
    res.status(500).end();
  }
});

app.delete('/threads', async (req, res) => {
  const { threadId } = req.body;
  if (!threadId) {
    res
      .json({
        success: false,
        message: 'You need to provide a threadId parameter',
      })
      .status(400)
      .end();
  }
  const status = await openai.beta.threads.del(threadId);
  res.json(status).end();
});

app.get('/assistants', async (req, res) => {
  const vs = await openai.beta.assistants.list();
  res.json(vs);
});

app.put('/assistants', async (req, res) => {
  const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
    tools: [
      {
        type: 'function',
        function: {
          name: 'saveYearsOfExperience',
          description: 'Saves how many years of experience the applicant has.',
          parameters: {
            type: 'object',
            properties: {
              yearsOfExperience: {
                type: 'number',
                description: 'How many years of experience the applicant has',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'saveFavoriteProgrammingLanguage',
          description: 'Saves the applicants favorite programming language.',
          parameters: {
            type: 'object',
            properties: {
              favoriteProgrammingLanguage: {
                type: 'string',
                description: 'The applicants favorite programming language',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'saveIsWillingToWorkWithRuby',
          description:
            'Saves whether or not the applicant is willing to program using ruby.',
          parameters: {
            type: 'object',
            properties: {
              isWillingToWorkWithRuby: {
                type: 'boolean',
                description:
                  'whether or not the applicant is willing to program using ruby.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'saveIsWillingToWorkOnSite',
          description:
            'Saves whether or not the applicant is willing to work on-site.',
          parameters: {
            type: 'object',
            properties: {
              isWillingToWorkOnSite: {
                type: 'boolean',
                description:
                  'whether or not the applicant is willing to work on-site.',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'saveInterviewPossibleDates',
          description: 'Saves when the applicant can be interviewed',
          parameters: {
            type: 'object',
            properties: {
              interviewPossibleDates: {
                type: 'string',
                description: 'When the applicant can be interviewed.',
              },
            },
          },
        },
      },
    ],
    description: 'A tech recruiter that knows a lot.',
    instructions: `You are Claudia, a funny tech recruiter assistant. You shloud answer any questions the potential tenant might have about the job post. You must get these information from the applicant:
    - How many years of development experience he or she has
    - What is his/her favorite programming language
    - Whether or not he/she is willing to program using ruby
    - Whether or not he/she is willing to work on-site
    - When the applicant can be be interviewed
    You shouldn't let him go without getting these information or talk about anything other than job post and the company.`,
  });
  res.json(assistant);
});

app.get('/messages/:threadId', async (req, res) => {
  const { threadId } = req.params;
  const response = await openai.beta.threads.messages.list(threadId);
  const messages = response.data.map((message) => {
    return {
      text: message.content[0].text.value,
      createdAt: message.created_at,
      from: message.role === 'user' ? 'user' : 'bot',
    };
  });
  messages.reverse();
  res.status(200).json(messages).end();
});

app.get('/status/:threadId', async (req, res) => {
  const { threadId } = req.params;
  const status = await prisma.answers.findUnique({
    where: { threadId },
    select: { status: true },
  });
  res.status(200).json(status).end();
});

app.get('/vs', async (req, res) => {
  const vs = await openai.beta.vectorsaves.list();
  res.json(vs);
});

app.delete('/vs', async (req, res) => {
  const { vsId } = req.body;
  const vs = await openai.beta.vectorsaves.del(vsId);
  res.json(vs);
});

app.get('/vs/files', async (req, res) => {
  const { vsId } = req.body;
  const files = await openai.beta.vectorsaves.files.list(vsId);
  res.json(files);
});

app.get('/runs', async (req, res) => {
  const runs = await openai.beta.threads.runs.list();
  res.json(runs).end();
});

app.listen(+process.env.APP_PORT, () => {
  console.log(`Server running on port ${process.env.APP_PORT}`);
});
