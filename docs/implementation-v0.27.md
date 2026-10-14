# Etap 0.27 - Atlas i Harpun

Pierwsze dwa kadłuby z nowej referencji rozwijają walkę obszarową i odzysk. Atlas jest grenadierem z dużą ładownią, a Harpun walczy szczękami. Modele są rysowane figurami Pixi zgodnie ze stylem istniejącej floty: metaliczne poszycie, jasnoniebieskie szkło, kontenery i widoczne mocowania narzędzi.

| Parametr                          | Atlas             | Harpun              |
| --------------------------------- | ----------------- | ------------------- |
| Kadłub / ładownia                 | 200 / 150         | 110 / 75            |
| Prędkość / skręt / boost          | 220 / 0,75 / 1,20 | 430 / 1,55 / 1,40   |
| Tarcza / regeneracja / opóźnienie | 90 / 5 na s / 7 s | 70 / 8,5 na s / 4 s |
| Działka / lasery / chwytaki       | 0 / 0 / 4 długie  | 0 / 0 / 4 długie    |
| Kamuflaż                          | Brak              | 35%                 |
| Cena: ruda / komponenty           | 180 / 16          | 155 / 14            |
| Wymagany warsztat                 | II                | II                  |

## Specjalizacje i ograniczenia

- Atlas ma cztery duże zewnętrzne kontenery, centralny kokpit i wyrzutnie zamiast działka oraz laserów. Duża ładownia i cztery chwytaki pomagają zbierać łup, ale niska prędkość, zwrotność i brak ciągłego lasera zachowują odrębność Muła jako górnika.
- **LPM Atlasa** wystrzeliwuje rakietę: prędkość 240 m/s, czas lotu 12 s, zasięg nominalny 2880 m, przeładowanie 1,8 s, obrażenia bazowe 160, promień wybuchu 180 m. **PPM** wypuszcza granat: prędkość 320 m/s, zapalnik 0,7 s, nominalny lot 224 m, przeładowanie 0,55 s, obrażenia 45, promień wybuchu 65 m. Obie bronie wybuchają przy trafieniu albo po upływie czasu lotu. Rakiety i granaty zadają obrażenia obszarowe skałom oraz wrogom, najwyżej raz na obiekt i wybuch. Skały korzystają z mnożnika wydobycia pilota i normalnego rozpadu oraz łupu. Osłony terenowe blokują obrażenia, a broń nie uszkadza przyjaznych obiektów, kadłuba ani tarczy właściciela.
- Namierzanie Atlasa wymaga 3 s ciągłego trzymania kursora na tym samym wrogu w zasięgu rakiety. Przesunięcie kursora przerywa nieukończony postęp; ukończony lock pozostaje po przesunięciu kursora i pozwala wystrzelić rakietę w dowolną stronę. Rakieta stopniowo skręca do przypisanego celu. Pierścień przy wrogu pokazuje postęp i pełny lock. Śmierć celu usuwa przypisanie oraz nieukończone namierzanie; rakiety lecą dalej bez naprowadzania. Namierzenie kolejnego celu nie zmienia celu rakiet już wystrzelonych.
- Moduły Atlasa: **Salwa granatów** (slot lasera) dodaje jeden granat na poziom, wypuszczany w symetrycznym stożku. **Układ rakietowy** (slot dysz) daje +25% obrażeń rakiet oraz +20% skrętu rakiet i manewrów kadłuba na poziom. Ceny, zapis modułów, kryształy i poziomy pozostają zgodne z wcześniejszymi zapisami. Zakup działek na Atlasie jest zablokowany; stare pola uzbrojenia pozostają zgodne z zapisem, ale nie tworzą działek ani laserów.
- Harpun ma okrągły kokpit, odsłonięte przeguby i szczęki. Podejmuje wrak bojowy w 1,5 s, a cel ratunkowy w 2 s, zamiast zwykłych 3 i 4 s. HUD, podpowiedzi i pierścień postępu korzystają z rzeczywistego czasu operacji.
- Harpun walczy dwiema przegubowymi szczękami zamiast działka i lasera. Mocowania są połączone z kadłubem, a nieużywane ramiona układają się przy bokach w zgiętej pozycji, z łokciami cofniętymi i szeroko otwartymi szczękami skierowanymi do przodu. Przytrzymanie PPM płynnie je wysuwa ku celowi, puszczenie je składa. Przy celowaniu do tyłu końcówki zachowują swoje strony kadłuba, zamiast krzyżować ramiona. Kliknięcie LPM uruchamia jeden zacisk: zamknięcie trwa 0,08 s, ponowne rozwarcie 0,14 s, a kolejne kliknięcie jest dostępne po cyklu 0,32 s. Samo przytrzymanie LPM nie powtarza zacisków.
- Zacisk zadaje bazowo 45 obrażeń skałom i 95 statkom. Każdy obiekt dostaje obrażenia najwyżej raz na cykl, nawet przy kontakcie obu szczęk. Zasięg końców ramion wynosi około 173 m przy skali kadłuba; krawędź szczęk może dosięgnąć powierzchni obiektu nieco dalej. Skały nadal rozpadają się na normalne fragmenty i łup, a zniszczone drony rozliczają walkę i odzysk.
- Ramiona wykrywają kontakt przez zapytania Rapier bez przenoszenia sił na kadłub. Ich kontakt nie odbiera kadłuba ani tarczy, nie uszkadza napędu i nie pozwala trafiać przez ściany lub skały. Obrys fizyczny samego kadłuba wyklucza ramiona; rzeczywiste zderzenie kadłuba nadal jest niebezpieczne.
- Specjalne moduły Harpuna: **Przeguby ramion** (dotychczasowy slot dysz) dają +15% zasięgu oraz +20% szybkości wysuwu i skrętu na poziom. **Siłowniki szczęk** (slot lasera) dają +25% obrażeń skał i statków na poziom. Koszty, kryształy, poziomy i zapis dotychczasowych modułów zostają zachowane. Pozostałe ulepszenia nadal rozwijają napęd, ładownię, kadłub i tarczę.
- Widok uzbrojenia Harpuna prezentuje szczęki i ich parametry; zakup lub montaż działek jest zablokowany. Dawniej posiadane działka mogą pozostać w zapisie i wartości złomowania, ale nie tworzą mocowań, pocisków ani laserów na Harpunie.
- Wymagania spokojnego lotu, przerwania po trafieniu, jeden hol i ryzyko zniszczenia holowanego celu nie zmieniają się. Harpun nie zwiększa odporności wraku; jego kadłub jest słabszy od Manty, lecz skuteczniej hamuje.
- Stocznia pokazuje osiem typów na dwóch stronach. Limit sześciu posiadanych statków pozostaje bez zmian.
- Nowe kadłuby korzystają z istniejącego formatu zapisu 15, zakupów, ulepszeń, złomowania i odzysku. Nie wymagają migracji wcześniejszych kampanii.

## Weryfikacja

Rozszerzone testy kadłubów obejmują wyposażenie, ograniczenia zakupów, zapis obu modeli i dokładne progi podejmowania holu. Sprawdzają także przerwanie podejmowania wraku przez LPM i ratunku przez PPM oraz zgodność procentowego postępu z krótszym czasem Harpuna. Testy szczęk obejmują składanie, celowanie, pojedynczy zacisk na kliknięcie, obrażenia skał i statków, łup, blokowanie przez ściany, brak obrażeń od kontaktu ramion, zachowanie pauzy oraz skuteczność ulepszeń po obrocie kadłuba. Istniejące testy holowania, ratunku i tarcz pozostają wspólną bramką regresji.

Testy Atlasa obejmują próg 3 s namierzania, przerwanie i śmierć celu, lot rakiety wystrzelonej poza kierunkiem celu, utratę naprowadzania, splash statków i skał, zapalnik granatów, blokowanie przez ściany, zachowanie zasobów, brak friendly fire oraz zapis i rzeczywiste salwy ulepszonych granatów.

Następny kierunek: kadłub obronny inspirowany Aegis, po rozstrzygnięciu nazwy i specjalizacji. Widmo, Żądło oraz Feniks pozostają konceptami.
