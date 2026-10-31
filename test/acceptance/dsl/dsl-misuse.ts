import { DslParamsError } from '@feral-auth/ts-simple-dsl';

import { expectTrue } from '../drivers/assertions';

/**
 * Expectations about the *DSL itself* rather than about the service.
 *
 * A prose step that is called wrongly must say so clearly, since a mistyped
 * parameter name would otherwise look like a service failure. These checks
 * keep those messages under test.
 *
 * The one DSL file that asserts, because its subject is a broken call, which no
 * driver ever sees. It still goes through drivers/assertions.ts.
 */

function indent(text: string): string {
  return text.split('\n').map(line => `  ${line}`).join('\n');
}

/**
 * Runs a step that is expected to be malformed, and asserts it reported
 * exactly the expected problems, each matched as a substring.
 *
 * The one place a spec passes something other than `"name: value"` strings.
 * Its subject is a broken call, which by definition cannot be written as a
 * well-formed one.
 */
export async function expectStepRejected(
  step: () => Promise<unknown>,
  ...expectedProblems: string[]
): Promise<void> {
  let caught: unknown;

  try {
    await step();
  } catch (error) {
    caught = error;
  }

  expectTrue(
    caught instanceof DslParamsError,
    'the step to have been rejected before it reached the service, but it was accepted'
  );

  const { problems, } = caught as DslParamsError;
  const reported = indent(problems.join('\n'));

  for (const expected of expectedProblems) {
    expectTrue(
      problems.some(problem => problem.includes(expected)),
      `expected a problem mentioning:\n  ${expected}\nbut the step reported:\n${reported}`
    );
  }

  expectTrue(
    problems.length === expectedProblems.length,
    `expected exactly ${expectedProblems.length} problem(s), but the step reported:\n${reported}`
  );
}
