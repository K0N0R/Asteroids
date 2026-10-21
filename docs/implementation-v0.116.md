# 0.116 — Ceres do późniejszego użycia w pasie asteroid

Dodano `ceresTerrain.ts` i wygląd `ceres` w katalogu ilustracji. `planetView('ceres')` zwraca samodzielny glob ze wspólnym maskowaniem, zakrzywionym cieniem i cache tekstury. Bazowy promień ilustracji wynosi 96 jednostek; docelowa skala w świecie będzie określona później.

Grafika nawiązuje do referencji autora: szarości z cieplejszymi i chłodniejszymi obszarami, większe nakładające się kratery i drobniejsze uderzenia, dyskretne grzbiety oraz wyróżniony basen z kilkoma nieregularnymi jasnymi plamami. Plamy są elementem barwy powierzchni, bez animacji lub efektu emisji światła. Detale są deterministyczne i nie powstają co klatkę.

To przygotowanie zasobu do dalszego projektowania. Ceres nie jest nowym sektorem kampanii. Nie dodano jej do obecnego układu pasa, listy nawigacyjnej, kolizji, powierzchni grywalnych ani zadań. Istniejący typ ilustracji `PlanetAppearance` obsługuje Ceres niezależnie od `StorySectorId`, dzięki czemu można później podłączyć ją jako ciało niebieskie w sektorze pasa. Format kampanii 66 i dziennika 29 bez zmian.

Weryfikacja: duży i mały podgląd przeglądarkowy, typecheck, lint zmienionych modułów, cztery istniejące testy planet i paralaksy oraz build release.
