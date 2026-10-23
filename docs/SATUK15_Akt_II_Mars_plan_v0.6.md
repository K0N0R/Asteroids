# Akt II — korekta układu i testowania, v0.6

Uzupełnia [v0.5](SATUK15_Akt_II_Mars_plan_v0.5.md). Zachowuje trzy obszary orbitalne i powierzchnię Fobosa.

- Moduł pamięci nadal wymaga fizycznego holowania do Satuk 15 i analizy po powrocie. Wraki statków i wyłączone drony są opcjonalnym odzyskiem. Nawigacja nie może zastępować wymaganego modułu bliższym wrakiem.
- Przelot śluzą prowadzi kamerę przez wspólną przestrzeń. Obiekty obu końców są dostępne w trakcie przelotu; radar płynnie interpoluje swój środek i skalę. Sceneria planet nie jest niszczona i tworzona od nowa przy każdej zmianie mapy.
- Anomalia pokrywa około 75% orbity Marsa i 25% orbity Fobosa. Przejścia mają krzywizny, zmienną szerokość, odnogi, połączone alternatywne trasy, polany i ślepe zaułki. Zastępują prostokątny labirynt z jedną drogą. Granica jest interpolowana, a grafika delikatnie faluje.
- Fizyka i AI odległych obszarów są uśpione. Renderowanie skał przechowuje otoczenie kamery z zapasem, a nie wszystkie odwiedzone miejsca. Animacja zejścia na powierzchnię nie przygotowuje ogromnego orbitalnego pola tekstur anomalii.
- ESC udostępnia techniczny powrót do bazy oraz wybór dowolnego sektora. Wybór sektora używa osobnego zapisu testowego, bez dopisywania ukończonych misji do zwykłej kampanii. Menu pozwala wrócić do zwykłego zapisu.
- Prospector po utracie sygnału zawsze ulega zniszczeniu. Nie pozostaje odzyskiwalny ani nadający się do recyklingu kadłub. Kapsuła pilota nadal może przetrwać. Zasada obejmuje również stare sygnały z wrakiem utraconego Prospectora, bez nagradzania częściami.

Technologia wycinania nowych przejść w anomalii pozostaje osobnym późniejszym etapem.
