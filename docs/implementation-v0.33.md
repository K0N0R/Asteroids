# Orbit 0.33 - intendent pokladowy

Kolejny podpunkt ogolnego planu zalogi: Niko Rell moze uczestniczyc w wyprawie i przygotowywac zestawy dla mechanika. Etap rozwija istniejace zatrudnianie intendenta, nie dodaje drugiej niezaleznej postaci tej samej profesji.

## Przydzial

- Panel Zaloga / Intendent ma wybor Stacja / Poklad, bez dodatkowej oplaty za przeniesienie.
- Wymagany jest zatrudniony intendent i pusta kolejka recyklingu. Zmiana przydzialu jest zablokowana podczas wyprawy.
- Przydzial pokladowy wyklucza jednoczesna prace w bazie. Mechanik moze pracowac na stacji albo na pokladzie niezaleznie.
- Bezpieczny powrot zachowuje przydzial. Strata statku lub odswiezenie aktywnej wyprawy traci obu przydzielonych pracownikow. Zaloga pozostawiona w bazie pozostaje bezpieczna.

## Zestawy w locie

- Przy zerowym zapasie na pokladzie i co najmniej 8 komponentach w ladowni intendent rozpoczyna 30-sekundowa prace. Pilot moze dalej prowadzic walke i wydobycie.
- Po ukonczeniu pobiera 8 komponentow i dodaje jeden zestaw. Nie korzysta z banku ani rudy; pozwala przetwarzac rowniez pelna ladownie.
- Brak komponentow, gotowy zestaw lub osiagniecie limitu zapasow zeruje postep bez pobrania kosztu. Niezakonczona praca nie daje produktu i nie przechodzi na nastepna wyprawe.
- Pauza, wybor prototypu i zakonczenie wyprawy zatrzymuja zadanie wraz z symulacja.
- Mechanik moze zuzyc nowy zestaw do automatycznej naprawy; po zuzyciu intendent rozpocznie kolejny cykl, jezeli wystarcza komponentow.
- Mule zachowuje natychmiastowa produkcje na PPM wedlug dotychczasowej receptury. Jej ukonczenie przerywa prace intendenta bez dodatkowego pobrania komponentow ani drugiego zestawu.
- Wspolny limit 10 zestawow uwzglednia zapas stacji i pokladu. Wytworzone w locie zestawy, w tym z Mule, sa uwzgledniane w rozliczeniu bezpiecznego powrotu.

## Interfejs i zapis

Panel zalogi pokazuje przydzial, parametry zadania i blokade stanowiska w bazie. TAB rozroznia postep produkcji, brak komponentow, gotowy zestaw i limit zapasow; mechanik zachowuje swoj odrebny status naprawy.

Format 17 dodaje boolowskie `crew.quartermasterAboard`. Migracja zapisow 1-16 pozostawia intendenta w bazie i zachowuje przydzial mechanika z wersji 16. Walidacja odrzuca bledne typy, przydzial bez zatrudnienia i zadania stacji u pracownika na pokladzie. Dotychczasowy znacznik wyprawy, flota, bank, piloci i kolejki zachowuja swoje zasady.

## Weryfikacja

Testy obejmuja przydzial, migracje, kolejki, niezalezna prace drugiej profesji i jednokrotna strate zalogi. Symulacja sprawdza dokladnie 30 sekund, koszt tylko przy ukonczeniu, pelna ladownie, brak intendenta, przerwanie pracy, limit 10 i powrot z nowym zestawem. Osobne regresje obejmuja wspolprace z mechanikiem, zamrozenie po koncu wyprawy i zbieg produkcji z PPM Mule.

Bramki: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Weryfikacja przegladarkowa odbywa sie na osobnym adresie bez odswiezania kampanii uzytkownika. Praca offline i wznowienie wypraw pozostaja poza tym etapem.