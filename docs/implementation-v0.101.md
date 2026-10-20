# Wdrożenie 0.101 — wymienne elementy portretów

Zastąpiono cztery dawne fryzury i jeden krój kombinezonu biblioteką elementów wektorowych. Styl odnosi się do dostarczonych przez autora referencji: odkryta głowa, jednolita twarz bez oczu, brwi, nosa i ust, lekkie cieniowanie krawędzi oraz subtelny obrót. Kobiety i mężczyźni mają różne proporcje obrysu głowy i ramion; elementy włosów i stroju są dostępne dla obu grup.

Pula zawiera 15 fryzur: krótka, zaczesana na bok, quiff, loki, bob, kucyk, warkocz, loki typu locs, kok, undercut, fale, grzywka, zgolona, krótkie sprężynki i długie włosy. Jest 8 obrysów twarzy i 6 strojów: kombinezon lotniczy, mundur dowodzenia, strój naukowy, kurtka techniczna, kamizelka i ubiór terenowy. Osobno dobierane są skóra (8), włosy (9), akcenty (8), tkanina (5), strona obrotu i słuchawka. Żaden odcień skóry nie jest zarezerwowany dla konkretnej płci ani specjalizacji.

Wizerunek generycznego pilota wynika z jego ID i archetypu, bez nowego pola zapisu. Imiona i dane pilotów pozostają dotychczasowe; wygląd w naborze jest tym samym wyglądem po zatrudnieniu, klonowaniu danych, wczytaniu, w panelu wyprawy i w akcji ratunkowej. Dotychczasowi piloci również korzystają z nowej oprawy.

Postacie mówiące podczas misji mają jawnie ustalone zestawy zamiast pseudolosowych ID: Ada Serrin — dowodzenie, bordowy warkocz i biało-bordowy mundur; dr Ivo Nadir — nauka, ciemna skóra, krótkie loki i jasny strój z turkusowym akcentem; Tomas Vale — instruktor, brązowy quiff i pomarańczowy kombinezon. Osobno przygotowano wzorzec mechaniczki z kokiem i kurtką techniczną. Trzy portrety rozmówców są podłączone do wspólnego panelu odpraw i raportów radiowych.

Weryfikacja: testy całej puli dla kobiet i mężczyzn, różnic między kandydatami, zgodności podglądu po zatrudnieniu i wczytaniu oraz 180 kombinacji fryzur, ubiorów i kierunków obrotu pod kątem granic portretu i niszczenia grafiki. Zachowano testy istniejącej tożsamości pilotów i odpraw. Sprawdzono w przeglądarce galerię wszystkich fryzur, portret w dialogu oraz nabór pilotów. Typecheck, lint i release build; bez pełnej regresji.

Aplikacja 0.101.0. Kampania 65, dziennik 29 bez zmian.

