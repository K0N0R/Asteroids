# 0.82 — skaner złóż i trwały skład odłamków

Data: 2026-10-19. Format kampanii: 50 (bez nowego stanu zapisu).

## Działanie

Wskaż celownikiem pobliską skałę: HUD pokazuje nazwę złoża i pierwiastki, które można z niego uzyskać, łącznie z późniejszymi odłamkami. Granica odczytu to 950 m od statku do powierzchni skały. Znacznik wskazuje aktualny obiekt. Odczyt nie podgląda odległych złóż, innej instancji powierzchni ani obiektów po zniszczeniu; znika także podczas podróży i po stracie statku.

Każdy obiekt otrzymuje przy powstaniu niezmienny, deterministyczny plan urobku. Skaner, rzeczywisty łup oraz zawartość potomnych odłamków korzystają z tego samego planu. Suma zawartości odłamków i luźnego urobku równa się początkowemu odczytowi. Dane opisują odzyskiwalne porcje gry, nie kilogramy, udziały procentowe ani wzór chemiczny skały. Naturalne źródła nadal zwracają wyłącznie pierwiastki, a złoże Merkurego wymaga Harpuna.

Instruktor pobiera najwyżej dwie porcje żelaza; pozostała zawartość skały trafia do rzeczywistego odłamka do wydobycia przez gracza. Powtórne rozliczenie zniszczonej skały nie daje kolejnego łupu. Fragmenty skał powierzchniowych zachowują przytwierdzenie do gruntu. Brak miejsca w puli skał powoduje uwolnienie minerałów nieutworzonego odłamka. Przy licznych luźnych porcjach urobek trafia do pakietów, a nie znika na limicie obiektów. Chwytaki nadal pobierają pojedyncze porcje zgodnie z pojemnością ładowni.

## Weryfikacja

- Pełna regresja: **537/537**, log `dist/mineral-regression.log` (w tym osiem nowych przypadków złóż).
- Po pełnym przebiegu dodano dodatkowy test pełnej puli fizyki; osobny przebieg dziewięciu testów złóż: **9/9**.
- Typecheck, lint i build: OK.
- Testy: deterministyczne składy 128 wariantów i różnych rozmiarów, zgodność sum całego drzewa rozpadu, pokrycie dziewięciu podstawowych pierwiastków przez dostępne źródła, specjalne złoża, próbka instruktora, rzeczywisty rozpad w Rapier, ochrona przed duplikacją, zasięg czujnika, limity obiektów łupu i fizyki.
- Izolowany podgląd renderowanego świata/HUD bez zapisu kampanii: widoczny skład, zaznaczenie skały, wyczyszczenie odczytu po opuszczeniu celu, brak błędów konsoli. Zrzut lokalny `dist/qa-mineral-scan.jpg`; tymczasowa strona QA nie wchodzi do wydania.

## Granice tego pakietu

Nie zmieniano jednocześnie ilości i rozkładu dotychczasowych złóż; to rozpoznawanie zawartości i porządek jej rozliczania. Nowe klasy złóż, mapa źródeł w recepturach, koszty floty z rodzin części, tiery II–III oraz przebudowa aktu I pozostają do kolejnych etapów. Interfejs Satuk 15 zachowuje uzgodniony układ.

## Uzupełnienie — wygląd oznaczeń pierwiastków

Asteroidy, ich odłamki oraz skały powierzchniowe otrzymały kuleczki pierwiastków z kolorami wspólnego katalogu. Nieregularne złote i fioletowe znaczniki oraz linie oznaczające złoża zostały usunięte. Oznaczenia korzystają z rzeczywistej zawartości `deposit.total`, również przy resztce po próbce instruktora. Jeden kolor wskazuje obecność pierwiastka; liczba kuleczek nie oznacza ilości ani procentowego udziału. Usunięto tint całego obrazu miedzi, aby nie przekłamywał kolorów oznaczeń. Złoże tytanu także pokazuje właściwy kolor pierwiastka.

Sprawdzenia tej paczki wizualnej: typecheck, lint, build; 27/27 testów złóż i Księżyca, w tym regresja współdzielonych grafik przy tym samym kształcie i innej zawartości. Kontrola renderowania sześciu rodzajów skał w dużej i małej skali: bez błędów konsoli. Zrzut `dist/qa-asteroid-markers.jpg`. Tymczasowa strona QA została usunięta z wydania.

Do planu dodano podłączenie istniejącego `frontend/assets/sounds/cc0/music/theme_loop.mp3` jako zapętlonej muzyki tła, zgodnej z ustawieniami głośności i bez dublowania odtwarzania. W tej paczce nie podłączano muzyki.
