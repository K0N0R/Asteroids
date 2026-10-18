# Wersja 0.71 — ziemska łączność i transfer ładunku

Data: 2026-10-18. Pierwsze wdrożenie nowego cyklu wyprawy przy Ziemi. Format kampanii **44**, dziennika **20**; poprzednie formaty są odrzucane, bez migracji.

## Raporty przez radio

Po dostrojeniu przekaźnika lub odczycie dalszego węzła Satuk 15 automatycznie potwierdza raport w dolnym panelu z portretem oficer operacyjnej. Kwestie przechodzi się ręcznie Enterem, spacją lub przyciskiem. Rozmowa wstrzymuje symulację, a potwierdzone zadanie i jednorazowa nagroda są zapisywane przed jej zakończeniem. Zniszczenie statku ani przerwanie połączenia przez odświeżenie nie cofają potwierdzonego raportu. Samo wybranie misji nie omija skanowania lub minigry.

Po potwierdzeniu wybranej misji otwiera się powrót; gracz może też kontynuować lot. Zapis poprawnie rozpoznaje aktywny rozkaz już wykonanego ziemskiego zadania. Przerwany rozkaz nie pozwala na dalsze automatyczne raportowanie i transfer.

Po zaopatrzeniu oraz przywróceniu łączności dalszy węzeł pojawia się podczas tej samej wyprawy. Widok, radar i cel nawigacji obsługują nowy obiekt. Warsztat nadal wymaga wizyty w stacji; podróż do Księżyca zachowuje swoje warunki.

## C — dostawy bez dokowania

Do 650 m od Satuk 15, na orbicie Ziemi, należy wyhamować poniżej 35 m/s i nacisnąć C. Transfer trwa 2,4 s; krąg i skrzynie poruszające się w stronę stacji pokazują postęp. Nie wymaga przytrzymywania klawisza. Ruch, ogień, obrażenia, wyjście z zasięgu lub rozpoczęcie innej pracy przerywają próbę. Do końca animacji nic nie jest pobierane z ładowni. Hipernapęd jest zablokowany podczas transferu.

Dostarczona ruda trafia najpierw do wymaganego zaopatrzenia, następnie do opcjonalnej rezerwy. Wyłącznie rzeczywista dostawa zasila zadania — nie pobieramy automatycznie ich nagród ani zasobów już znajdujących się w magazynie. Można dokonywać wielu częściowych dostaw podczas jednej wyprawy. Pozostały ładunek trafia do magazynu według tej samej kolejności priorytetów co podczas dokowania. Jeśli magazyn jest pełny, nieprzyjęta część pozostaje na statku.

W ziemskim panelu zadań nie trzeba naciskać osobnych przycisków oddawania rudy. Zwykłe dokowanie także rozlicza ziemskie dostawy, więc C nie jest obowiązkowym dodatkowym krokiem przed powrotem. Transfer nie kończy wyprawy.

## Trwałość i rozliczenie

Raporty i dostawy podnoszą rewizję zapisu natychmiast po przyjęciu. Aktywna wyprawa przechowuje sumę przekazanych materiałów; nie trafiają one ponownie do magazynu przy dokowaniu. Doświadczenie za ładunek jest obliczane raz po bezpiecznym powrocie, z uwzględnieniem wcześniejszych transferów i dotychczasowego limitu XP. Potwierdzone dostawy i nagrody pozostają w stacji także po śmierci; nieprzekazany ładunek przepada. Zmiana nie dodaje XP za samo otwieranie rozmów.

## Weryfikacja

**478/478 testów**. Typecheck, lint, build i `git diff --check` przechodzą.

W przeglądarce sprawdzono animację transferu w odległości 400 m, potwierdzenie rzeczywistej dostawy 24 Fe i 2 komponentów, wyzerowanie ładowni i kontynuację lotu. Osobno ręcznie dopasowano trzy kanały przekaźnika, zatwierdzono synchronizację i potwierdzono automatyczną rozmowę, znacznik ukończenia oraz wznowienie lotu. Bez błędów i ostrzeżeń konsoli. Scenariusze korzystały z osobnej kampanii QA i przygotowanych pozycji oraz ładunku; nie oznaczają ciągłego przejścia dziesięciu aktów od nowego zapisu.

Sześć nowych testów obejmuje: raport w locie i jego trwałość po stracie oraz odczycie zapisu; ujawnienie kolejnego węzła w tym samym locie; rzeczywisty transfer C w symulacji z wieloma dostawami, jednym naliczeniem materiałów i XP; pełny magazyn i przerwanie; trafienie oraz śmiertelne trafienie przed rozliczeniem; odwrót, obcy sektor i odrzucenie starego formatu. Zmieniono oczekiwania testów, które wcześniej wymagały raportu dopiero po dokowaniu.

Testy przemysłu kontrolują również pierwszeństwo cennych produktów w pełnym magazynie. Ruda przekazana do aktywnego zaopatrzenia liczy się jako dostawa do zadania, a nie utracona nadwyżka.

## Granice pakietu

Nowy cykl obejmuje **Ziemię**. Księżyc i kolejne akty zachowują obecne zasady raportowania, budowy i dostaw; transfer C nie zastępuje budowy księżycowej ani fizycznego holowania. Nie wdrożono jeszcze towarzysza AI. Następny pakiet powinien przenieść potwierdzenia na zwiad Księżyca i raporty obrony, ze wspólną kontrolą częściowych liczników walk, etapów konstrukcji i nagród. Dopiero potem towarzysz będzie prowadził przez ustabilizowany początek gry.
