# Wersja 0.73 — instruktor w drugim Prospectorze

Data: 2026-10-18. Format kampanii 45 i dziennika 20 pozostaje aktualny; nie dodano migracji starszych formatów.

## Prowadzenie przy Ziemi

Przed potwierdzeniem dalszej ziemskiej trasy obok statku gracza startuje drugi Prospector, sterowany przez pilota instruktora. Ma osobne oznaczenie, punkt na radarze, status i HP w HUD. Klawisz **V** wskazuje jego pozycję.

Instruktor dobiera cel z rzeczywistego postępu i ładunku. Najpierw prowadzi na skraj złoża i wyjaśnia wydobycie. Gdy gracz uzbiera brakującą rudę albo zapełni ładownię, kieruje się ku Satuk 15 i przypomina o transferze C. Następnie pomaga dotrzeć do przekaźnika, wyjaśnia strojenie kanałów, powrót do warsztatu i odczyt dalszego węzła. Wybrana misja łączności ma pierwszeństwo przed domyślną kolejnością wydobycia. Postęp z poprzednich wypraw jest uwzględniany.

Wskazówki wypowiada przez dolny panel radiowy z portretem pilota instruktora. Każdy rodzaj wskazówki jest ogłaszany najwyżej raz podczas danej wyprawy; powrót do tego samego etapu nie otwiera ponownie tej samej kwestii co klatkę. Kolejny wylot może ponowić potrzebne objaśnienia.

## Fizyczny statek i sytuacje awaryjne

Statek porusza się w Rapierze i korzysta z planowania drogi wokół skał. Nie teleportuje się do gracza ani celu. Po utracie kontaktu czeka; V pozwala go odnaleźć. Ponowne zbliżenie wznawia prowadzenie, a zablokowana droga otrzymuje osobny komunikat. Jeśli gracz użyje hipernapędu albo poleci samodzielnie, może dokończyć misje bez instruktora.

Po potwierdzeniu dalszej trasy lub odwrocie instruktor sam wraca na podejście do Satuk 15, również jeśli gracz zostanie daleko. Po dotarciu znika krótko wygaszany. Nie dodaje nowej animacji dokowania gracza.

Instruktor ma kadłub Prospectora, reaguje na fizyczne zderzenia, wrogie pociski i miny. W obszarze ochronnym stacji korzysta z ochrony przed obrażeniami. Jego zniszczenie daje efekt eksplozji i komunikat, ale nie zabiera pilota z listy gracza, nie nalicza straty jego statku i nie blokuje zadań. Przy kolejnym wylocie szkoleniowym pojawia się zastępca. Rozpoczęte wskazówki i zdrowie instruktora są stanem wyprawy, nie nowym członkiem zarządzanej floty.

Instruktor nie wydobywa, nie pobiera zasobów, nie stroi przekaźnika i nie przyznaje postępu za samo dotarcie do celu. Służy prowadzeniu początku gry, nie zastępuje eskortowanego Muła. Nie pojawia się w sandboxie, przy Księżycu ani po potwierdzeniu ziemskiej trasy.

## Weryfikacja

**490/490 testów**; typecheck, lint, build i `git diff --check` przechodzą.

Siedem nowych testów obejmuje dostępność w odpowiednim sektorze bez zajmowania miejsca we flocie, wybór celu z rozkazu i ładunku, oczekiwanie przy złożu bez przyznawania postępu, fizyczne ominięcie dużej asteroidy, utratę i wznowienie kontaktu bez teleportacji i powtarzania komunikatów, zniszczenie rzeczywistym pociskiem bez blokowania raportów oraz powrót do podejścia stacji po potwierdzeniu trasy. Pełne testy dotychczasowych misji nadal przechodzą z dodatkowym statkiem w świecie.

W przeglądarce sprawdzono widok obu Prospectorów, rozmowę pilota instruktora, wznowienie lotu po Enter, nawigację V, radar i oczekiwanie przy złożu. Konsola bez błędów i ostrzeżeń. Użyto osobnego profilu QA z początkowym postępem i zasobami 0 oraz pominiętą odprawą stacji; pozycje i statki nie były przestawiane. Nie było to ciągłe przejście całej kampanii.

## Dalej

Nowy cykl prowadzenia, raportowania i dostaw działa na początku aktu I. Następny pakiet powinien ujednolicić potwierdzenia w aktach II–X, pilnując częściowych liczników patroli, raportów wieloetapowych walk i jednorazowych nagród. Dalsze kierunki to unikalne zadania sektorów, pierwsza misja odzysku w skażonej anomalii oraz przegląd paczek dźwięków zgodnie z bieżącym planem.
