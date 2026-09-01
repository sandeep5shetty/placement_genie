import assert from "node:assert/strict";
import test from "node:test";
import { classifyPlacementQuestion } from "../../lib/placement/question-scope";

test("classifyPlacementQuestion rejects unrelated careers", () => {
  assert.equal(
    classifyPlacementQuestion("Can I be a truck driver"),
    "out_of_scope"
  );
  assert.equal(
    classifyPlacementQuestion("How do I become a chef?"),
    "out_of_scope"
  );
});

test("classifyPlacementQuestion allows campus readiness questions", () => {
  assert.equal(
    classifyPlacementQuestion("Am I ready for Google's SDE role?"),
    "in_scope"
  );
  assert.equal(
    classifyPlacementQuestion(
      "What should I learn next for a product analyst internship?"
    ),
    "in_scope"
  );
});

test("classifyPlacementQuestion treats greetings separately", () => {
  assert.equal(classifyPlacementQuestion("hi"), "greeting");
  assert.equal(classifyPlacementQuestion("What can you do?"), "greeting");
});

test("classifyPlacementQuestion marks unknown questions as uncertain", () => {
  assert.equal(
    classifyPlacementQuestion("What is the capital of France?"),
    "uncertain"
  );
});
