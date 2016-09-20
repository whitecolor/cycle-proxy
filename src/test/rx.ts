import * as test from 'tape'
import { Observable as O } from 'rx'
import { proxy } from '../rx'
import { circulate } from '../circulate/rx'

test('rx: target$ should not start when proxy$ attached', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6])
    .do(() => t.fail())
  let proxy$ = proxy()
  proxy$.proxy(target$)
  setTimeout(() => t.end())
})

test('rx: target$ should not start if proxy$ subscribed', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6])
    .do(() => t.fail())
  let proxy$ = proxy()
  proxy$.proxy(target$)

  proxy$.subscribe()
  setTimeout(() => t.end())
})


test('rx: proxy$ should not emit if target$ subscribed', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()
  proxy$.do(() => t.fail()).subscribe()
  proxy$.proxy(target$)
  target$.subscribe()
  setTimeout(() => t.end())
})

test('rx: proxy$ should not emit if target$ subscribed and proxy$ subscribed', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  proxy$.proxy(target$)

  proxy$.subscribe(() => t.fail())

  target$.subscribe()

  setTimeout(() => t.end())
})

test('rx: proxy$ should emit if proxied$ subscribed', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.subscribe(() => emitted++)

  proxied$.subscribe()

  setTimeout(() => {
    t.equal(emitted, 5)
    t.end()
  })
})

test('rx: proxy$ should stop emitting when proxied$ unsubscribed', (t) => {
  let target$ = O.fromArray([1, 2, 3, 5, 6]).delay(0).share()
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.subscribe(() => {
    emitted++
  })

  let sub = proxied$.subscribe(() => {
    if (emitted === 2) sub.dispose()
  })

  // target may still be subscribed
  target$.subscribe()

  setTimeout(() => {
    t.equal(emitted, 2)
    t.end()
  }, 10)
})


test('rx: circulate (no properties)', (t) => {
  let target$ = circulate<number>((target$) => {
    return target$.map(x => x * 2)
      .startWith(1)
      .delay(1)
  })
  let results: number[] = []
  let sub = target$.subscribe((x) => {
    results.push(x)
    if (results.length === 4) {
      sub.dispose()
      t.deepEqual(results, [1, 2, 4, 8], 'results ok')
      t.end()
    }
  })
})

test('rx: circulate (properties: ...string[])', (t) => {
  let circ = circulate((target$: O<number>) => {
    return {
      target$: target$.map(x => x * 2)
        .startWith(1)
        .delay(1)
    }
  }, 'target$')
  let results: number[] = []
  let sub = circ.target$.subscribe((x) => {
    results.push(x)
    if (results.length === 4) {
      sub.dispose()
      t.deepEqual(results, [1, 2, 4, 8], 'results ok')
      t.end()
    }
  })
})

test('rx: circulate (properties: {...})', (t) => {
  let circ = circulate(({target$}: { target$: O<number> }) => {
    return {
      target$: target$.map(x => x * 2)
        .startWith(1)
        .delay(1)
    }
  }, { target$: true })
  let results: number[] = []
  let sub = circ.target$.subscribe((x) => {
    results.push(x)
    if (results.length === 4) {
      sub.dispose()
      t.deepEqual(results, [1, 2, 4, 8], 'results ok')
      t.end()
    }
  })
})

test('rx: circulate (factory)', (t) => {
  let circ = circulate<number>('target$')
    ((target$) => {
      return {
        target$: target$.map(x => x * 2)
          .startWith(1)
          .delay(1)
      }
    })
  let results: number[] = []
  let sub = circ.target$.subscribe((x) => {
    results.push(x)
    if (results.length === 4) {
      sub.dispose()
      t.deepEqual(results, [1, 2, 4, 8], 'results ok')
      t.end()
    }
  })
})