import { expect } from "vitest";
import * as matchers from "vitest-axe/matchers";
import "./tests/_helpers/withPersonaCookie";

expect.extend(matchers);
