# Implementacja 0.57 — minigra łączności

Stan: 2026-10-16. Początek pakietu pełniejszych misji aktu I.

## Działanie

Ziemska **Łączność orbitalna** wymaga teraz dostrojenia przekaźnika. W zasięgu punktu 7 zwolnij poniżej 60 m/s, wyłącz ciąg i broń, następnie naciśnij E. Przytrzymywanie E nie zastępuje zadania.

Panel zawiera trzy kanały. Złota fala przedstawia wzorzec, turkusowa — odebrany sygnał. Przyciski strzałek przesuwają fazę cyklicznie po ośmiu położeniach. Oznaczenie „ZGODNY” uzupełnia kolor. Po dopasowaniu wszystkich kanałów przycisk **SYNCHRONIZUJ** przekazuje odczyt do raportu wyprawy. Błędne zatwierdzenie pokazuje informację i pozostawia możliwość poprawy, bez zużywania zasobów.

**Świat nadal działa.** Podczas obsługi panelu sterowanie statkiem jest neutralne, a istniejący opór wyhamowuje jednostkę. Nie używamy ciągłego S, które przy małej prędkości włącza wsteczny ciąg. Wrogowie, pociski i produkcja stacji nadal postępują. Trafienie, zbyt duża prędkość, użycie uzbrojenia lub utrata zasięgu przerywają próbę. Przycisk **PRZERWIJ** pozwala ją zakończyć ręcznie. Ponowienie wymaga kolejnego naciśnięcia E i zaczyna strojenie od początku.

Dane są początkowo tylko na statku. Rozkaz wyprawy pozwala wrócić po synchronizacji, ale zadanie i nagroda rozliczają się dopiero po bezpiecznym dokowaniu. Śmierć, odświeżenie i odwrót zachowują dotychczasowe reguły utraty raportu.

Zakres obejmuje ziemski przekaźnik kampanii. Pozostałe skany i niezależne próby sandboxa zachowują dotychczasową obsługę. To pierwszy wariant minigry; kolejne interakcje techniczne mogą wykorzystać osobne reguły zamiast kopiować ten sam panel.

## Zapis

Format kampanii pozostaje **36**, dziennika **15**. Strojenie jest stanem aktywnego lotu; nie wprowadza migracji ani wznowienia wypraw. Niezgodne formaty nadal są odrzucane.

## Weryfikacja

- **405/405 testów**, bez pominięć; sześć nowych przypadków minigry.
- Model faz: deterministyczny start, cykliczne przesuwanie, błędne i prawidłowe zatwierdzenie oraz odrzucenie nieprawidłowego kanału.
- Symulacja: samo trzymanie E nie daje danych; przerwanie i ponowienie, utrata zasięgu, użycie broni, prawdziwy pocisk wroga i dalszy upływ czasu.
- Odblokowanie dokowania po strojeniu oraz zapis postępu dopiero po powrocie; profil testowy nadal obsługuje zwykły skan.
- Dotychczasowy test przejścia nowym Prospectorem rzeczywiście wydobywa zasoby, otwiera panel poprzez interakcję w locie, wykonuje przesunięcia i zatwierdzenie, wraca, uruchamia warsztat i otwiera trasę na Księżyc. Nie dodaje danych przekaźnika bezpośrednio do raportu.
- Typecheck, lint i produkcyjny build przeszły.
- Przeglądarka 1280×720: normalny start z bazowym Prospectorem, ręczny dolot, otwarcie E po wyhamowaniu, błędne zatwierdzenie, dopasowanie wszystkich kanałów i udana synchronizacja otwierająca powrót. Brak błędów konsoli. Zapis wejściowy przygotował tylko ukończoną odprawę wprowadzającą; bez zasobów i postępu misji. Bezpieczny powrót sprawdzono w testach symulacji, nie w tej sesji przeglądarki.

Dowody: [strojenie](validation-v0.57/tuning.png), [dopasowane kanały](validation-v0.57/matched.png), [odczyt na pokładzie](validation-v0.57/completed.png).

## Kolejny krok

Eskorta wydobywcza Muła: sojusznicza jednostka AI dolatuje do złoża, zbiera materiały i wraca, a gracz zapewnia osłonę. Scenariusz ma wykorzystać istniejącą nawigację eskorty i realne wydobycie; szczegóły fal, długość i nagrody wymagają dalszego wdrożenia i prób.
