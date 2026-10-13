# Prototyp 0.7 — patrole AI i pierwsza walka

## Zakres

Każdy sektor ma pięć dronów: jeden przy Wraku Echa, dwa przy bogatej żyle i dwa przy obserwatorium Mnemos. Rozmieszczenie jest deterministyczne dla seeda, z osobnym generatorem losowym, który nie zmienia układu asteroid. Sprawdzamy początkową odległość od bazy, skał i innych dronów. Początkowe pole rudy oraz przekaźnik Lumen nie otrzymały strażników.

Dron patroluje swój punkt, wykrywa gracza z odsłoniętą linią widzenia, podejmuje pościg i stara się krążyć w odległości 340 jednostek. Celuje z wyprzedzeniem uwzględniającym ruch gracza i własną prędkość odziedziczoną przez pocisk. Przed strzałem ładuje działko przez 0,65 s: widać łuk wokół kadłuba i linię celowania. Trafienie drona przerywa ładowanie. Czerwony, kanciasty kadłub, pasek zdrowia, czerwone pociski i znaczniki minimapy odróżniają wroga od gracza.

Asteroidy blokują wykrywanie i ostrzał. Po utracie widoczności dron korzysta z ostatniej widzianej pozycji, a po 2,5 s przerywa pościg. Przerywa go również przy odległości od gracza ponad 1150 lub od punktu patrolu ponad 1100. Następnie fizycznie wraca do patrolowania. Ruch używa dynamicznych ciał Rapiera, ograniczonego przyspieszenia i obrotu oraz trzech krótkich czujników omijania skał.

Aurora chroni gracza przed pociskami dronów w promieniu 850 jednostek. Wlot do tej strefy kończy pościg; dron znajdujący się w niej wycofuje się na zewnątrz. Ochrona dotyczy ostrzału: zderzenia i inne zagrożenia nadal działają. HUD pokazuje strefę bezpieczną, pobliski patrol, liczbę ścigających dronów i liczbę zniszczeń.

## Roboczy balans

| Parametr | Wartość |
| --- | --- |
| Kadłub drona | 54 |
| Prędkość patrolu / pościgu | 100 / 250 |
| Zasięg wykrywania / ognia | 800 / 650 |
| Ładowanie / przerwa po strzale | 0,65 / 1,3 s |
| Pocisk drona | 12 obrażeń, prędkość 650, czas życia 1,6 s |
| Działko gracza przeciw kadłubom | 18 obrażeń — trzy trafienia niszczą drona |
| Łup po dronie | 3 rudy + 2 komponenty |

Pełny cykl ostrzału obejmuje przerwę i kolejne ładowanie. Skały pochłaniają wrogie pociski bez obrażeń i bez tworzenia łupu. Pociski dronów nie trafiają innych dronów. Pociski gracza wybierają pierwszą skałę albo wroga na przebytej drodze przez ray cast; szybkie pociski nie polegają wyłącznie na sprawdzeniu końcowego punktu.

Premie wydobycia kadłuba, pilota i modułu działka nadal wzmacniają wydobycie, ale nie obrażenia wrogim kadłubom. Sterowanie i parametry początkowego Prospectora pozostają bez zmian. Zebrany łup bojowy zajmuje ładownię i jest rozliczany jak pozostałe materiały, dopiero przy dokowaniu. Daje normalne PD za dostarczony ładunek; samo zniszczenie przeciwnika nie przyznaje osobnej premii PD.

Ostrzał może zniszczyć statek i uruchamia dotychczasowy system strat oraz szansę ratunku. Trafienia przerywają naprawę, skanowanie i podjęcie celu ratunkowego. Sam pocisk nie powoduje awarii napędu; tę nadal może wywołać mocne zderzenie. Pauza zatrzymuje AI, a koniec wyprawy zwalnia ciała i widoki dronów.

## Zapis i ograniczenia

Format kampanii pozostaje 6. Patrole, ich zdrowie i pociski są stanem wyprawy; nie zapisujemy ich do wznowienia. Odświeżenie aktywnej misji nadal oznacza stratę. Akcja ratunkowa odtwarza początkowe patrole sektora z seeda, wraz z pierwotnym układem skał; wcześniejsze zabójstwa nie są trwałym oczyszczeniem sektora.

To jeden typ przeciwnika i roboczy balans. Nie ma jeszcze kontraktów bojowych, oddzielnych broni, frakcji, kamuflażu ani infiltracji. Czujniki przeszkód nie zastępują planowania tras: gęsty pas lub układ poruszających się skał może chwilowo zatrzymać drona. Nie wdrażamy globalnego wzrostu trudności z czasem — ryzyko wynika z miejsca, do którego leci gracz.

## Weryfikacja

Przeszły wszystkie 73 testy, kontrola typów, lint i build produkcyjny. Jedenaście nowych testów sprawdza generowanie patroli na 100 seedach, wykrywanie, ładowanie i rzeczywiste trafienia AI, osłonę skał, utratę celu i powrót, ochronę bazy, przerwanie skanowania i naprawy, śmierć, jednokrotne zniszczenie oraz rozliczenie łupu. Sprawdzono również, że premie wydobywcze nie zwiększają obrażeń wrogim kadłubom.

Test w przeglądarce odbył się na osobnym zapisie pod portem 3001. Pilot dotarł do Wraku Echa, został wykryty i trafiony dwukrotnie, zniszczył drona, zebrał dokładnie 3 rudy i 2 komponenty, naprawił awarię po zderzeniu w drodze powrotnej i zadokował. Magazyn otrzymał ten ładunek, pilot dostał 7 PD, a niewykorzystany zestaw wrócił do bazy. Kolejna wyprawa potwierdziła obecność nowego patrolu oraz wykrycie po usunięciu osłony asteroid. Konsola testowej karty nie zgłosiła błędów ani ostrzeżeń. Zapis użytkownika na porcie 3000 nie był używany do testów.

Zrzuty: [aktywny pościg](screenshots/combat-v0.7.jpg), [powrót z łupem bojowym](screenshots/combat-return-v0.7.jpg).
