# Wdrożenie 0.93 — transport budowlany i naprawy

Przycisk załadunku określa miejsce dostawy: stację księżycową, bazę marsjańską lub placówkę Wenus. Pojawia się przy aktywnym projekcie budowlanym. Wybiera kompletny pozostały manifest aktualnego etapu, a właściwy wylot uruchamia osobny przycisk. Jest nieaktywny, jeśli brakuje któregokolwiek składnika lub całość nie mieści się w wybranym statku. Start ponownie sprawdza pełny koszt i pojemność przed pobraniem czegokolwiek. Zwykły wylot nie wymaga ładunku. Usunięto dowolny wybór kilku poszyć i osobny przycisk natychmiastowego wylotu z częściową dostawą.

Pierwszy etap księżycowy obejmuje 19 gotowych części: 8 poszyć, 4 maszynerie, 3 elektroniki, 2 układy zasilania i 2 podtrzymywania życia. Można wytworzyć je w Satuk 15. Karty zadań pokazują nazwy dostarczanych rzeczy oraz dostarczone/wymagane ilości. Późniejsza rozbudowa nadal wykorzystuje miejscowe wydobycie z Mułem. Wcześniej przekazane ilości pozostają na budowie; wymaganie kompletności dotyczy przygotowywanego transportu ze stacji.

Przekierowanie zasilania i hakowanie nie wymagają materiałów. Usunięto koszt poszycia i wszystkie komunikaty nakazujące zabrać komponent do sabotażu.

Zestawy naprawcze korzystają z jednego zapasu kampanii. Nie są przenoszone na statek, nie mają limitu pokładowego i nie wracają z wyprawy. Produkcja w dowolnej dostępnej bazie zwiększa wspólny zapas. Ukończona naprawa zużywa jeden zestaw, a strata statku pozostawia niewykorzystane sztuki. Muł nadal naprawia się bez zestawów. Usunięto przycisk zabierania zestawu na Księżycu i osobne liczniki zapasu lokalnego oraz pokładowego.

Wersja aplikacji 0.93.0, kampanii 61 i dziennika 26. Starsze zapisy odrzucane bez migracji zgodnie z dotychczasowym ustaleniem.

Weryfikacja celowana: pięć scenariuszy pełnego manifestu, braku składnika, przekroczenia pojemności, wspólnego zapasu i braku kosztu minigry oraz dwa dopasowane scenariusze produkcji księżycowej i darmowej naprawy Muła. Typecheck, ESLint zmienionych źródeł i build przechodzą. Podgląd przeglądarkowy obejmuje niepełny komplet, wybór pełnej dostawy i licznik wymagań w zadaniu. Bez pełnej regresji.
