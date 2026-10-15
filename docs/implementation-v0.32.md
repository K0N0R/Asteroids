# Orbit 0.32 - mechanik pokladowy

Pierwsza czesc ogolnego planu zalogi pokladowej: mechanik stacji moze uczestniczyc w wyprawie i wykonywac zadanie naprawy. Pozostale profesje, praca offline i wznowienie wypraw nie sa wdrozone w tym etapie.

## Przydzial i gospodarka

- Zatrudniona Ada Vale ma w panelu Zaloga dwa przydzialy: Stacja / Poklad. Bez dodatkowej oplaty za przeniesienie.
- Przydzial mozna zmieniac tylko poza wyprawa. Wejscie na poklad wymaga pustej kolejki mechanika; oplacone zadania mozna najpierw anulowac z dotychczasowym zwrotem.
- Mechanik pokladowy nie przyjmuje ani nie wykonuje produkcji w stacji. Intendent nadal pracuje niezaleznie.
- Przydzial dotyczy aktywnego statku na kolejnej wyprawie i pozostaje po bezpiecznym powrocie. Strata statku, w tym odswiezenie aktywnej wyprawy, oznacza strate mechanika; kapsula pilota nie zwraca mechanika. Wynik wyprawy informuje o stracie.
- Nie ma dodatkowych darmowych zestawow ani pracy naliczanej poza czasem symulacji.

## Naprawa podczas lotu

- Zadanie rozpoczyna sie przy awarii napedu lub kadlubie ponizej 60% maksimum.
- Automatyczna naprawa trwa 8 sekund i pozwala dalej pilotowac, strzelac i wydobywac.
- Po zakonczeniu zuzywa dokladnie jeden pokladowy zestaw, usuwa awarie i przywraca 25 HP, nie przekraczajac maksymalnego kadluba. Korzysta z dotychczasowych efektow spawania, dzwieku oraz rozliczenia zestawow.
- Bez zestawow postep jest zerowany. Powyzej progu i bez awarii mechanik pozostaje w gotowosci i oszczedza zestawy.
- Reczna naprawa pod R zachowuje 5 sekund i wymog spokojnego lotu. Zmiana trybu zeruje postep, aby nie przenosic czasu pomiedzy dwoma czasami pracy.
- Pauza, wybor prototypu i koniec wyprawy zatrzymuja symulacje, a wraz z nia naprawe. Panel pokladu TAB pokazuje gotowosc, postep albo brak zestawow; komunikat akcji rozroznia mechanika i reczna naprawe.

## Zapis i weryfikacja

Format kampanii 16 dodaje boolowskie `crew.mechanicAboard`. Starsze wersje 1-15 sa migrowane z mechanikiem pozostawionym na stacji. Walidacja odrzuca brak pola w nowym formacie, bledne typy, przydzial bez zatrudnionego mechanika i jednoczesne zadania warsztatu. Bank, flota, piloci, poziomy, kolejki i aktywny znacznik wyprawy zachowuja dotychczasowe zasady.

Testy obejmuja przydzial, blokady i kolejki, niezaleznego intendenta, powrot i jednokrotna strate, migracje oraz odrzucanie niespojnych zapisow. Testy symulacji sprawdzaja 8 sekund podczas ciagu i ostrzalu, dokladnie jeden zestaw, naprawe silnika i kadluba, brak automatycznej naprawy bez zalogi, prog 60%, brak zestawu i przelaczanie trybow. Istniejace regresje recznej naprawy pozostaja.

Bramki: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Podglad przegladarkowy korzysta z osobnego adresu, bez odswiezania sesji uzytkownika.
