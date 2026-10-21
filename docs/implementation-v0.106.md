# Wdrożenie 0.106 — Hangar i Stocznia

Hangar zarządza posiadanymi statkami, Stocznia projektami i budową. Obie zakładki mają niezależny wybór oraz historię widoku. Ikona Stoczni przedstawia suwnicę z podwieszonym kadłubem.

## Widoki

- Parametry: ilustracja statku, sześć parametrów i dostępne działania.
- Budowa w Stoczni: komplet sześciu rodzin części w czytelnej siatce, stan magazynu i blokady budowy.
- Ulepszenia: sześć osobnych zakładek modułów; efekt teraz → po ulepszeniu, koszt dokładnego tieru i przycisk montażu. Projekt pozwala oglądać I/II/III bez zakupu modułów.
- Warianty: trzy istniejące kierunki wyposażenia, parametry właściwe kadłubowi, koszty odblokowania i montaż. Zmiana rezerwowego statku wymaga uprzedniej aktywacji.
- „Stwórz” otwiera recepturę odpowiedniej części i tieru. Powrót zachowuje wybrany statek, projekt i moduł.
- Potwierdzenie złomowania pokazuje odzysk w siatce z paginacją, także przy wielu rodzinach i tierach części.

Podgląd modułu skaluje i centruje obrócony statek według jego rzeczywistych granic. Zajmuje pole 170 × 102 poniżej przełączników tieru i powyżej listy części. Dotyczy Hangaru i Stoczni.

## Weryfikacja

22 testy: interfejs hangaru, podglądy modułów, koszty wyposażenia i budowa floty. Test geometrii obejmuje 14 kadłubów × 6 modułów × 3 tiery. Testy sprawdzają również brak mutacji kampanii w podglądzie projektu, blokady montażu i odnośniki do receptur właściwego tieru.

Sprawdzono wizualnie osobne zakładki menu, widoki modułów i wariantów, przejście do produkcji z powrotem oraz Swift z laserem tieru III. Format kampanii 66 i dziennika 29 pozostaje bez zmian; gospodarka i zasady wyposażenia korzystają z istniejących transakcji.
