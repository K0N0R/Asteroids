# 0.115 — lifting Plutona

`plutoTerrain.ts` zastępuje losowe kratery i dwie nakładające się jasne elipsy osobną ilustracją powierzchni. Chłodne lodowe równiny i cieplejsze beżowe obszary kontrastują z rdzawoczerwonym terenem. Asymetryczne jasne „serce” ma dwa różne płaty, delikatne podziały wewnętrzne i osobną barwę obu części. Dodatkowe wyspy szronu, nieliczne kratery i uskoki nie zasłaniają głównego motywu.

Ilustracja jest stylizowaną interpretacją referencji, a nie dokładną mapą geologiczną. Glob otrzymał zakrzywioną granicę cienia i słabszą dekoracyjną poświatę. `planetView('pluto')` aktualizuje mapę Układu Słonecznego, bazę oraz tło wyprawy. Zachowano rozmiar, położenie, paralaksę i statyczny cache grafiki. Brak zmian misji, fizyki oraz formatów zapisu: kampania 66, dziennik 29.

Weryfikacja: podgląd dużej i małej ilustracji w osobnej karcie przeglądarki; cztery istniejące testy planet i paralaksy; typecheck, lint zmienionych modułów i build release.
