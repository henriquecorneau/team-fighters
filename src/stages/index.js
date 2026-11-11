import labreal from './labreal.js';
import main from './main.js';
import exp from './exp.js';
import tech from './tech.js';
import mech from './mech.js';
import capy from './capy.js';

export const STAGES = [labreal, main, exp, tech, mech, capy];
export const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s]));
