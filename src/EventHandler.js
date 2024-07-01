import { EventEmitter } from 'node:events';
import FunctionCallingList from './FunctionCallingTool.js';

export default class EventHandler extends EventEmitter {
  constructor(client, res) {
    super();
    this.client = client;
    this.res = res;
  }

  async onEvent(event) {
    try {
      // Retrieve events that are denoted with 'requires_action'
      // since these will have our tool_calls
      if (event.event === 'thread.run.requires_action') {
        await this.handleRequiresAction(
          event.data,
          event.data.id,
          event.data.thread_id,
        );
      }
      //Send message to user when messages is completed
      if (event.event === 'thread.message.completed') {
        this.res.json({
          answer: event.data.content[0].text.value,
          threadId: event.data.thread_id,
          createdAt: event.data.created_at,
        });
      }
    } catch (error) {
      console.error('Error handling event:', error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs =
        data.required_action.submit_tool_outputs.tool_calls.map((toolCall) => {
          FunctionCallingList[toolCall.function.name](
            threadId,
            JSON.parse(toolCall.function.arguments),
          );
          return {
            tool_call_id: toolCall.id,
            output: 'ok',
          };
        });
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error('Error processing required action:', error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit('event', event);
      }
    } catch (error) {
      console.error('Error submitting tool outputs:', error);
    }
  }
}
