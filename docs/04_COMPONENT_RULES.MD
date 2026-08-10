# COMPONENT RULES


## Panel Component


All sections should be reusable panels.


Properties:


Panel
|
|- title (optional — omit when the caller's chrome already owns the
|  heading, e.g. every routed module page's `PageLayer`; Panel skips its
|  own header entirely rather than duplicate it)
|- status (optional, falls back to "SYSTEM NOMINAL")
|- metadata
|- content


---

## Project Card


Structure:


+-----------------------+

PROJECT_ID

IMAGE


TITLE


STACK

React
TypeScript
Node


STATUS

DEPLOYED


+-----------------------+


---

# Component Style Rules


Every component must:

- have a technical label
- have clear hierarchy
- use borders
- avoid rounded corners
