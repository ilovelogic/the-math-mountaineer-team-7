# controller/

Decides what happens next: which screen runs, what a choice means, when to save. `GameFlow`, the `Screen` interface and one controller per screen type live here.

May import `model/`, `view/` and `content/`. Nothing else imports from here except `main.ts`.
