# Wdrożenie 0.104 — pamięć, hipernapęd i czytelność lotu

Data: 2026-10-21. Aplikacja 0.104.0; format kampanii 65 i dziennika 29 bez zmian.

## Pamięć

`ShapeLibrary` zachowywała konteksty wszystkich napotkanych wariantów asteroid do końca wyprawy, również po usunięciu ich widoków. Konteksty mają teraz licznik korzystających z nich widoków i są niszczone wraz z ostatnim właścicielem. Jednocześnie widoczne skały nadal mogą współdzielić geometrię. Test 10 000 kolejnych wariantów sprawdza zwolnienie geometrii i pusty cache; test w przeglądarce potwierdza zero zachowanych kontekstów po wyrenderowaniu i usunięciu 1000 wariantów.

To potwierdzony błąd czasu życia zasobów, ale sam screen zbiorczego zużycia pamięci przez 15 procesów Chrome nie pozwala przypisać całych 14,7 GB temu mechanizmowi. Nie deklarujemy pomiaru wielogodzinnej stabilności całej przeglądarki.

## Hipernapęd

Usunięto odmowę startu przez przeszkody na trasie, ponowne sprawdzanie trasy przed odlotem i śmiertelny test zderzenia podczas tranzytu. Od rozpoczęcia ładowania do końca przelotu wyłączone są fizyczne kolizje statku oraz holowanych obiektów. Zwykły lot i anulowanie przywracają je. W trakcie przelotu nie można odłączać holu ani oddawać ładunku. Odłączany obiekt zawsze odzyskuje swój collider.

Pozostają warunki sprawności napędu, podejścia do śluzy, ograniczenia prędkości, trwającej walki i niedokończonych interakcji. Inne obiekty świata nadal symulują zwykłe zderzenia między sobą.

## Muzyka

W użytej wersji `@pixi/sound` wznowienie zapętlonego `WebAudioInstance` ustawiało `loopStart` na pozycję pauzy. Skutkiem było powtarzanie końcówki zamiast pełnego utworu. Motyw korzysta teraz z jednego natywnego elementu audio, którego pauza zachowuje pozycję i pełne granice pętli. Muzyka nie jest równocześnie dekodowana do bufora WebAudio w preloadzie. Efekty pozostają w dotychczasowym mikserze.

Utrata fokusu i ukrycie strony pauzują motyw, powrót wznawia tę samą instancję. Zabezpieczono przerwany start i szybki powrót fokusu, odmowę autoplay oraz zmiany głośności podczas oczekującego startu. Nasłuchy są rejestrowane jeden raz. Test przeglądarkowy: wznowienie przy końcu utworu i przejście przez granicę do 1,06 s z 195,33 s, jedna instancja, odtwarzanie aktywne.

## HUD i Księżyc

- HUD filtruje ukończone cele przy każdym odświeżeniu. Dziennik i historia nadal zachowują ukończone zadania.
- Potwierdzenie radiowe trzech fal wrogów poprawnie zamyka `lunar-attack`, zapisuje rezultat przed dokowaniem i nalicza nagrodę raz. Mylący niezaliczony wpis ze screena to osobna opcjonalna obrona budowy przed asteroidami. Ma teraz jednoznaczną nazwę i znika, jeżeli gracz pominął ją przed ukończeniem późniejszej obrony stacji. Nie przyznaje to nagrody za pominięte zadanie.
- Napisy HUD i oznaczenia świata mają ciemny cień oraz delikatny obrys. Nie jest to filtr pełnego ekranu.
- Przyciemniono regolit, morza, obrzeża i dna większych kraterów. Schemat mórz i rozkład kraterów pozostają.
- Zejście i powrót mają łagodny przygaszający woal, łuk horyzontu, dyskretne smugi ruchu i podpisy na ciemnym panelu. Zachowano ciągłą kamerę, nieruchome położenie ekranowe statku i holu oraz blokadę sterowania podczas przejścia.

## Weryfikacja

47 zaliczonych testów ukierunkowanych: audio, zwalnianie geometrii, aktywne zadania HUD, hipernapęd, obrona stacji i przejścia księżycowe. Dodatkowo typecheck, lint zmienionych plików, build release i diff check. Podglądy oraz test renderowania i granicy muzyki wykonano w osobnej, ukrytej karcie bez przeładowania gry użytkownika.

Podglądy lokalne: `dist/lunar-descent-104.png` i `dist/lunar-ascent-104.png`.
