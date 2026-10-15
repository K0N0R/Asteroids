# Wersja 0.36 — porównywanie modułów w sandboxie

Obecny sektor i pętla lobby → wyprawa → powrót/strata są sandboxem do sprawdzania mechanik, statków i balansu. Nie stanowią docelowej struktury kampanii. Lifting geometrii statków jest zakończony na tym etapie.

## Wdrożone

W zakładce Ulepszenia hangaru i stoczni dostępne są trzy tryby podglądu:

- Zamontowane / Bazowy — rzeczywisty statek lub kadłub ze stoczni.
- Wybrany moduł — kliknięcie nazwy wybiera ulepszenie, a przyciski 0 / I / II / III zmieniają tylko jego poziom na modelu.
- Wszystkie III — pełny zestaw do porównania.

Pozostałe moduły posiadanego statku zachowują swoje rzeczywiste poziomy w podglądzie pojedynczego ulepszenia. Przy wyborze nazwy domyślnie podglądany jest następny poziom, maksymalnie III. Można oglądać również poziomy jeszcze niedostępne w warsztacie.

Obok modelu widać jeden główny parametr przed/po: ciąg, ładownię, HP kadłuba, pojemność tarczy lub parametr specjalizacji, np. siłę dasha, odnowienie kamuflażu, zasięg ramion, HP drona, siłę rakiety czy liczbę granatów. To nominalne parametry kadłuba i modułu, bez pilota i prototypów zdobywanych podczas wyprawy. Procent mocy modułu odnosi się do jego wartości bazowej, nie jest obietnicą identycznych obrażeń dla różnych broni.

Prawa lista zachowuje rzeczywiście zamontowane poziomy. Ceny w stoczni dotyczą poziomu I; zakup kadłuba nadal daje bazowy statek. Przycisk zakupu ulepszenia we flocie nadal kupuje następny rzeczywisty poziom, a nie konfigurację z podglądu. Po zakupie wraca widok zamontowanego wyposażenia.

## Bezpieczeństwo stanu

Konfiguracja podglądu jest osobną kopią. Nie zmienia statku, zapasu surowców, zapisanej kampanii, ceny modernizacji ani konfiguracji startującej wyprawy. Tryby podglądu są stanem interfejsu, bez zmiany formatu zapisu.

## Weryfikacja

Testy obejmują niezależność kopii od kampanii, zachowanie pozostałych modułów, zerowanie i ograniczenie poziomów, zachowanie tożsamości statku, rzeczywistą cenę i poziom zakupu po podglądzie III oraz parametry specjalizacji.

Kontrola w przeglądarce na porcie 3001: wybór pancerza Prospectora bez środków na zakup, przełączenie I → III, przejście do stoczni i porównanie pancerza Swifta przy zachowaniu zerowych poziomów bazowych i ceny kadłuba. Zapis użytkownika na porcie 3000 nie był zmieniany.

Pełny zestaw: **291/291 testów**, w tym długie testy symulacji sektora. TypeScript, pełny lint i build produkcyjny zakończone poprawnie. Sprawdzono również w stoczni podgląd III poziomu kamuflażu Widma (12 s → 7,5 s), bez zmiany bazowych modułów i kosztu kadłuba.

## Następny etap

Powtarzalne scenariusze testowe z seedem i wyborem konfiguracji, uruchamiane w odizolowanej sesji sandboxa. Mają służyć mierzeniu mechanik i balansu przed tworzeniem fabuły i kampanii. Szczegóły kolejności oraz kryteria domknięcia w [aktualnym planie](plan-current.md).
