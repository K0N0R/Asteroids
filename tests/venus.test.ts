import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDevelopmentAct } from '../frontend/game/state/development';
import { completeVenusTask } from '../frontend/game/state/venusActions';
import { storyDiscoveredTasks } from '../frontend/game/state/story';
import { VENUS_TASK_IDS } from '../frontend/game/state/venusAct';
import { enqueueRadio, pruneObsoleteVenusRadio } from '../frontend/game/state/communications';
test('Venus quest titles reveal Horyzont, guardian and Mercury only after the discovery', () => {
    const c = createDevelopmentAct('act-3'),
        p = c.story!;
    for (const id of VENUS_TASK_IDS.slice(0, 3)) completeVenusTask(c, id);
    const active = () => storyDiscoveredTasks(p).find((t) => !p.claimed.includes(t.id))!;
    assert.equal(active().title, 'Analiza transmisji');
    completeVenusTask(c, VENUS_TASK_IDS[3]);
    assert.equal(active().title, 'Instalacja SI');
    p.venus!.announcements.push('guardian');
    assert.equal(active().title, 'Przebudzenie strażnika');
    completeVenusTask(c, VENUS_TASK_IDS[4]);
    assert.equal(active().title, 'Odzysk specyfikacji');
    completeVenusTask(c, VENUS_TASK_IDS[5]);
    assert.ok(storyDiscoveredTasks(p).some((t) => t.title === 'Sygnał z Merkurego'));
});
test('obsolete Venus objectives leave the live radio queue and are not enqueued again', () => {
    const c = createDevelopmentAct('act-3'),
        p = c.story!,
        line = {
            speaker: 'operations' as const,
            text: 'Orbita Wenus jest dostępna. Rozpoznaj przekaźnik.',
        };
    assert.ok(enqueueRadio(p, line));
    completeVenusTask(c, VENUS_TASK_IDS[0]);
    assert.ok(pruneObsoleteVenusRadio(p));
    assert.equal(p.radio!.pending.length, 0);
    assert.equal(enqueueRadio(p, line), false);
});
