# Propozycje rozwoju po 0.19

Źródło: lista użytkownika i referencja portretów. Postacie mają być ludzkimi sylwetkami **bez oczu, nosa, ust ani innych rysów twarzy**. Styl pozostaje oparty na figurach Pixi.

## Pierwsza paczka — 0.20

- Portrety pilotów i załogi: odkryta skóra, fryzury, uniformy i zestawy słuchawkowe; brak rysów twarzy.
- Więcej imion i nazwisk, stabilnych dla tożsamości pilota i zachowanych przy odzysku.
- Wykropkowany, zanikający ślad podróży na radarze.
- Czytelniejsze strefy Aurory i patroli na radarze oraz delikatne granice obszarów pościgu w świecie.
- Płynne oddalenie kamery przy szybkiej podróży.
- Lifting kapsuły ratunkowej.

## Gospodarka trzeciego tieru — wdrożona w 0.21

- Trzeci surowiec: kryształy technologiczne. Balans pozostaje rozwijalny.
- Przetapianie komponentów na ten surowiec, z kolejką, kosztami i rezerwacją magazynu.
- Wymaganie nowego surowca przy mocniejszych ulepszeniach statku i stacji.
- Migracja kampanii, ładownie, magazyn, chwytaki, nagrody i interfejs obsługują wszystkie trzy surowce.

## Większy świat i zagrożenia — pierwsza część wdrożona w 0.22

- Większy dostępny obszar sektora i dostosowanie nawigacji, radaru, czasów wypraw oraz generatora.
- Mocniejszy dryf asteroid w wybranych obszarach; spokojne podejście do Aurory pozostaje chronione tarczą.
- Duże klastry skał z rzadkimi asteroidami w środku, wymagające przekopania się do skarbu.
- Losowe patrole przemierzające sektor, obok obecnych strażników cennych miejsc.

## Fortyfikacje — wdrożone w 0.23

- Twierdza Aegis: fizyczne ściany i brama, pięciu obrońców (dwa ciężkie drony), rdzeń z danymi, osobny kontrakt i nawigacja H. [Opis etapu](implementation-v0.23.md).

## Odzysk po walce — wdrożony w 0.24

- Zniszczony przeciwnik daje surowce lub pozostawia możliwy do podjęcia wrak.
- Holowanie wraku do doku Aurory i natychmiastowy recykling bez kończenia rundy; normalne dokowanie E również zalicza hol. Można dostarczyć wiele obiektów, widocznych w podsumowaniu, zachowanych po późniejszej śmierci/refresh. [Opis etapu](implementation-v0.24.md).
- Jasne zasady wyboru celu holu, miejsca na pokładzie, kolizji i przerwania operacji; dotychczasowe akcje ratunkowe pozostają odrębnym celem.

Załoga pokładowa i jej zadania w locie pozostają w ogólnym planie. Wznowienie wypraw i praca offline są późniejszymi etapami.


## Kolejne etapy — eskorty i ochrona statków

- Eskorta Keplera — wdrożona w 0.25: przyjazny statek badawczy AI, trasa omijająca skały, czekanie na gracza, zasadzka, badanie anomalii i premia po powrocie. [Opis i weryfikacja](implementation-v0.25.md).
- Następny etap: tarcze kinetyczne: niebieskie heksy ułożone w pierścień wokół statku, z niebieską poświatą; absorbują obrażenia przed kadłubem. Każdy typ statku otrzyma sensowne parametry pojemności, szybkości napełniania i opóźnienia po trafieniu, z możliwością rozwoju. Należy wdrożyć sposób uzupełniania tarcz, ich stan w HUD i efekty trafienia/wyczerpania. Propozycja do balansowania: regeneracja po chwili bez obrażeń i pełne ładowanie w Aurorze.
- Holowanie wymagające ostrożności — wdrożone w 0.24 dla podjętych celów: wrak i kapsuła mają odporność; zderzenia z asteroidami oraz trafienia pocisków wroga mogą je zniszczyć. Brak friendly fire i fizycznych kolizji między graczem a holowanym obiektem. Utrata obiektu musi jasno kończyć dany cel odzysku, bez wpływu na pozostałe cele; fizyka liny zachowuje bezwładność. Uwzględnić ochronę obiektu przez tarczę Aurory, obrażenia zależne od siły zderzenia i wynik ratowania pilota.


Ustalenie dotyczące dostaw (wdrożone): sam hol kończy się po wciągnięciu obiektu do doku Aurory. Wyprawa trwa dalej; E przy normalnym dokowaniu też rozlicza hol. Dziennik i podsumowanie obejmują wszystkie odholowane obiekty.


## Koncepty kolejnych sześciu kadłubów

Widmo, Atlas, Aegis, Żądło, Harpun i Feniks są referencją wizualną i pomysłami, nie sztywnymi wytycznymi. [Role, referencyjne parametry i uwagi do balansu](fleet-concepts.md). Rozwój floty nastąpi po rozróżnieniu specjalizacji oraz dodaniu statystyk tarcz.
