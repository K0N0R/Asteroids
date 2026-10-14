# Etap 0.28 - Aegis

Aegis jest obrońcą eskorty z jednym energetycznym działkiem na szpicy, impulsem tarcz i reaktywnym mini dronem. Szeroki srebrzysty kadłub, niebieskie panele, centralny kokpit oraz boczne węzły osłon nawiązują do referencji użytkownika. Statek Aegis i twierdza Aegis pozostają odrębnymi obiektami: kadłub ma identyfikator `aegis`, twierdza cel badawczy `fortress`.

| Parametr                        | Wartość bazowa                 |
| ------------------------------- | ------------------------------ |
| Kadłub / tarcza / ładownia      | 145 / 120 / 60                 |
| Regeneracja / opóźnienie tarczy | 8 na s / 5 s                   |
| Prędkość / skręt / boost        | 340 / 1,25 / 1,35              |
| Działko / lasery / chwytaki     | 1 energetyczne / 0 / 2 średnie |
| Koszt / warsztat                | 210 rudy, 22 komponenty / II   |

## Działko energetyczne - LPM

Długie błękitne pociski lecą z prędkością 780 m/s przez 1,5 s. Strzał co 0,5 s zadaje 36 obrażeń wrogowi i wyłącza możliwość strzelania przez 2,5 s; następne trafienie odnawia czas blokady. Przeciwnik nadal porusza się i manewruje, ale nie ładuje ani nie wypuszcza strzału do upływu blokady. Pociski już wystrzelone nie znikają.

Skała otrzymuje 12 obrażeń, z mnożnikiem modułu energetycznego i wydobycia pilota. To słabsze narzędzie niż laser, ale wyraźnie skuteczniejsze od zwykłych działek. Rozpad skał i zbieranie łupu pozostają standardowe. Aegis nie może wymieniać działka na zwykłe wyposażenie sklepu.

## Impuls ochronny - PPM

Kliknięcie PPM natychmiast odnawia stałą tarczę matki i dodaje 80 punktów tymczasowej osłony matce oraz sojusznikom w promieniu 420 m. Osłona działa przez 6 s, bez regeneracji, i pochłania realne obrażenia pocisków oraz zderzeń przed kadłubem. Chronieni są mini dron, statek badawczy oraz pobliskie wraki i cele ratunkowe, również holowane. Obiekt poza zasięgiem nie otrzymuje osłony.

Tarcza matki wizualnie rośnie; sojusznicy otrzymują powiększone, wygasające pierścienie. Zużyta osłona znika. Impuls odnawia się przez 18 s; przytrzymanie PPM nie uruchamia go ponownie. Użycie wymaga kolejnego kliknięcia po zakończeniu odnowienia. Zwykła regeneracja tarczy kinetycznej matki pozostaje aktywna. HUD pokazuje odnowienie i stan drona.

## Mini dron

Dron krąży w odległości 110 m od matki. Ma 50 HP, działko zadające 12 obrażeń co 0,6 s oraz zasięg 550 m. Nie rozpoczyna walki tylko dlatego, że wróg jest blisko. Reaguje na przeciwników, którzy rzeczywiście strzelili w stronę matki lub zostali trafieni jej pociskiem. Wybiera pobliski zarejestrowany cel z czystą linią strzału; nie strzela przez ściany ani matkę. Śmierć celu usuwa go z listy.

Dron może zostać zniszczony przez pociski i kolizje ze środowiskiem. Nie ma fizycznych kolizji z matką, eskortą ani holowanymi jednostkami. PPM chroni go tak samo jak pozostałych sojuszników. Po zniszczeniu odbudowa na R wymaga 5 s spokojnego lotu poniżej 80 m/s i zużywa jeden zestaw naprawczy. Strzelanie, impuls, ciąg i pozostałe przerwania naprawy anulują postęp. Odbudowa działa nawet przy pełnym kadłubie matki; brak zestawu nie tworzy drona. Każda nowa wyprawa rozpoczyna się z własnym dronem.

## Ulepszenia

- **Ogniwo energetyczne**: slot `drill`, +25% obrażeń działka przeciw statkom i skałom na poziom.
- **System drona**: slot `handling`, +25% obrażeń i HP drona oraz standardowe +20% manewrów matki na poziom.
- **Impuls ochronny**: slot `shield`, czas odnowienia `18 / (1 + 0,2 * poziom)` s, +25% bufora i stałej pojemności tarczy na poziom; normalna regeneracja tarczy również rośnie.
- Silnik, ładownia i pancerz matki zachowują istniejące działanie. Ceny, limity, kryształy, zapis i wartość złomowania modułów są zgodne z istniejącymi slotami.

## Zapis i weryfikacja

Format kampanii 15 pozostaje bez zmian. Kadłub jest kupowany, zapisywany i ulepszany przez istniejące mechanizmy. Katalog ma dziewięć typów na dwóch stronach, a limit posiadanej floty nadal wynosi sześć. Pauza, zakończenie i wybór prototypu zatrzymują drona, tarcze oraz odnowienie.

Testy obejmują neutralność i reaktywność drona, trafienia energetyczne i czasowe zatrzymanie strzelania, obrażenia skał i łup, ochronę matki, eskorty i holu, granice zasięgu, wygaśnięcie osłon, cooldown i pauzę, zniszczenie oraz odbudowę za zestaw, zakaz montażu zwykłego działka i zachowanie ulepszeń w zapisie.
