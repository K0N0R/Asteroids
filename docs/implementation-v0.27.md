# Etap 0.27 - Atlas i Harpun

Pierwsze dwa kadłuby z nowej referencji rozwijają transport i odzysk. Modele są rysowane figurami Pixi zgodnie ze stylem istniejącej floty: metaliczne poszycie, jasnoniebieskie szkło, kontenery i widoczne mocowania narzędzi.

| Parametr | Atlas | Harpun |
| --- | --- | --- |
| Kadłub / ładownia | 200 / 150 | 110 / 75 |
| Prędkość / skręt / boost | 220 / 0,75 / 1,20 | 430 / 1,55 / 1,40 |
| Tarcza / regeneracja / opóźnienie | 90 / 5 na s / 7 s | 70 / 8,5 na s / 4 s |
| Działka / lasery / chwytaki | 1 / 2 średnie / 4 długie | 0 / 0 / 4 długie |
| Kamuflaż | Brak | 35% |
| Cena: ruda / komponenty | 180 / 16 | 155 / 14 |
| Wymagany warsztat | II | II |

## Specjalizacje i ograniczenia

- Atlas ma cztery duże zewnętrzne kontenery i centralny kokpit. Większa pojemność oraz liczba ramion pomagają zbierać luźny łup, ale niższa prędkość, zwrotność i moc wydobycia (0,85 wobec 1,3 Muła) zachowują rolę Muła jako górnika.
- Harpun ma okrągły kokpit, odsłonięte przeguby i szczęki. Podejmuje wrak bojowy w 1,5 s, a cel ratunkowy w 2 s, zamiast zwykłych 3 i 4 s. HUD, podpowiedzi i pierścień postępu korzystają z rzeczywistego czasu operacji.
- Harpun walczy dwiema przegubowymi szczękami zamiast działka i lasera. Mocowania są połączone z kadłubem, a nieużywane ramiona składają się przy jego bokach. Przytrzymanie PPM płynnie je wysuwa ku celowi, puszczenie je składa. Kliknięcie LPM uruchamia jeden zacisk; kolejne kliknięcie jest dostępne po cyklu 0,55 s. Samo przytrzymanie LPM nie powtarza zacisków.
- Zacisk zadaje bazowo 28 obrażeń skałom i 65 statkom. Każdy obiekt dostaje obrażenia najwyżej raz na cykl, nawet przy kontakcie obu szczęk. Zasięg końców ramion wynosi około 173 m przy skali kadłuba; krawędź szczęk może dosięgnąć powierzchni obiektu nieco dalej. Skały nadal rozpadają się na normalne fragmenty i łup, a zniszczone drony rozliczają walkę i odzysk.
- Ramiona wykrywają kontakt przez zapytania Rapier bez przenoszenia sił na kadłub. Ich kontakt nie odbiera kadłuba ani tarczy, nie uszkadza napędu i nie pozwala trafiać przez ściany lub skały. Obrys fizyczny samego kadłuba wyklucza ramiona; rzeczywiste zderzenie kadłuba nadal jest niebezpieczne.
- Specjalne moduły Harpuna: **Przeguby ramion** (dotychczasowy slot dysz) dają +15% zasięgu oraz +20% szybkości wysuwu i skrętu na poziom. **Siłowniki szczęk** (slot lasera) dają +25% obrażeń skał i statków na poziom. Koszty, kryształy, poziomy i zapis dotychczasowych modułów zostają zachowane. Pozostałe ulepszenia nadal rozwijają napęd, ładownię, kadłub i tarczę.
- Widok uzbrojenia Harpuna prezentuje szczęki i ich parametry; zakup lub montaż działek jest zablokowany. Dawniej posiadane działka mogą pozostać w zapisie i wartości złomowania, ale nie tworzą mocowań, pocisków ani laserów na Harpunie.
- Wymagania spokojnego lotu, przerwania po trafieniu, jeden hol i ryzyko zniszczenia holowanego celu nie zmieniają się. Harpun nie zwiększa odporności wraku; jego kadłub jest słabszy od Manty, lecz skuteczniej hamuje.
- Stocznia pokazuje osiem typów na dwóch stronach. Limit sześciu posiadanych statków pozostaje bez zmian.
- Nowe kadłuby korzystają z istniejącego formatu zapisu 15, zakupów, ulepszeń, złomowania i odzysku. Nie wymagają migracji wcześniejszych kampanii.

## Weryfikacja

Rozszerzone testy kadłubów obejmują wyposażenie, ograniczenia zakupów, zapis obu modeli i dokładne progi podejmowania holu. Sprawdzają także przerwanie podejmowania wraku przez LPM i ratunku przez PPM oraz zgodność procentowego postępu z krótszym czasem Harpuna. Testy szczęk obejmują składanie, celowanie, pojedynczy zacisk na kliknięcie, obrażenia skał i statków, łup, blokowanie przez ściany, brak obrażeń od kontaktu ramion, zachowanie pauzy oraz skuteczność ulepszeń po obrocie kadłuba. Istniejące testy holowania, ratunku i tarcz pozostają wspólną bramką regresji.

Następny kierunek: kadłub obronny inspirowany Aegis, po rozstrzygnięciu nazwy i specjalizacji. Widmo, Żądło oraz Feniks pozostają konceptami.