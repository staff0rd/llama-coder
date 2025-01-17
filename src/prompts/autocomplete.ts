import { ollamaTokenGenerator } from '../modules/ollamaTokenGenerator';
import { countSymbol } from '../modules/text';
import { info } from '../modules/log';

export async function autocomplete(args: {
    endpoint: string,
    model: string,
    prefix: string,
    suffix: string,
    canceled?: () => boolean,
}): Promise<string> {

    // Calculate arguments
    let data = {
        model: args.model,
        prompt: `<PRE> ${args.prefix} <SUF>${args.suffix} <MID>`, // Codellama format
        raw: true,
        options: {
            num_predict: 256
        }
    };

    // Receiving tokens
    let res = '';
    let totalLines = 1;
    let blockStack: ('[' | '(' | '{')[] = [];
    outer: for await (let tokens of ollamaTokenGenerator(args.endpoint + '/api/generate', data)) {
        if (args.canceled && args.canceled()) {
            break;
        }

        // Block stack
        for (let c of tokens.response) {

            // Open block
            if (c === '[') {
                blockStack.push('[');
            } else if (c === '(') {
                blockStack.push('(');
            }
            if (c === '{') {
                blockStack.push('{');
            }

            // Close block
            if (c === ']') {
                if (blockStack.length > 0 && blockStack[blockStack.length - 1] === '[') {
                    blockStack.pop();
                } else {
                    info('Block stack error, breaking.');
                    break outer;
                }
            }
            if (c === ')') {
                if (blockStack.length > 0 && blockStack[blockStack.length - 1] === '(') {
                    blockStack.pop();
                } else {
                    info('Block stack error, breaking.');
                    break outer;
                }
            }
            if (c === '}') {
                if (blockStack.length > 0 && blockStack[blockStack.length - 1] === '{') {
                    blockStack.pop();
                } else {
                    info('Block stack error, breaking.');
                    break outer;
                }
            }

            // Append charater
            res += c;
        }

        // Update total lines
        totalLines += countSymbol(tokens.response, '\n');

        // Break if too many lines and on top level
        if (totalLines > 16 && blockStack.length === 0) {
            info('Too many lines, breaking.');
            break;
        }
    }

    // Remove <EOT>
    if (res.endsWith('<EOT>')) {
        res = res.slice(0, res.length - 5);
    }

    // Trim ends of all lines since sometimes the AI completion will add extra spaces
    res = res.split('\n').map((v) => v.trimEnd()).join('\n');

    return res;
}