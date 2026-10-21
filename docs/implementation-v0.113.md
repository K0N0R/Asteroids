# 0.113 — lifting Urana

`uranusAppearance.ts` dodaje osobną ilustrację atmosfery: turkusowo-błękitny glob, jaśniejszy obszar polarny, szerokie łagodne łuki chmur i kilka delikatnych smug. Wygląd nawiązuje do obu referencji autora i zachowuje uproszczony styl pozostałych planet. Zakrzywiona granica cienia zastępuje prosty podział półkul.

Dawne szerokie pierścienie zastąpiono trzema cienkimi, stonowanymi pasmami. Tylna i przednia połowa korzystają z tych samych elips spłaszczonych do proporcji 0,1 i nachylonych o 0,52 rad. Glob znajduje się pomiędzy obiema częściami. Kierunek atmosfery jest zgodny z nachyleniem pierścieni.

`planetView('uranus')` stosuje grafikę na mapie Układu Słonecznego, w bazie i w tle lotu. Promień globu, paralaksa, rozmieszczenie sektora, zadania i fizyka pozostają bez zmian. Statyczna grafika nadal jest cachowana; nie dodaje geometrii co klatkę ani pól zapisu. Kampania 66 i dziennik 29 bez zmian.

Weryfikacja: duża i mała ilustracja w podglądzie przeglądarkowym, zasłanianie pierścieni; cztery istniejące testy planet i paralaksy; typecheck, lint zmienionych modułów oraz build release.
