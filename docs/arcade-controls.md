# Sterowanie arcade

Dokument opisuje poprzedni model myszy i spacji. Od v0.8 obowiązuje [WASD, niezależne celowanie i boost](implementation-v0.8.md).

Aktualne ustalenie zastępuje lot z długim dryfem. Mysz nadal kieruje i celuje, spacja uruchamia lot, a Shift służy do szybkiego zatrzymania.

- Maksymalna prędkość: 480 jednostek/s, rozbieg bazowy około 0,48 s.
- Szybki, wygładzony obrót w kierunku myszy, bez przelatywania przez cel. Przejście kursora przez granicę kąta wybiera najkrótszy obrót.
- Podczas lotu napęd koryguje także wektor prędkości. Skręt nie zostawia statku w długim bocznym poślizgu.
- Zwolnienie spacji włącza automatyczną stabilizację. Prędkość spada poniżej 5 jednostek/s w około sekundę; końcówka hamowania zatrzymuje statek całkowicie.
- Shift ma pierwszeństwo przed spacją i zatrzymuje statek z pełnej prędkości w około 0,27 s.
- Awaria ogranicza przyspieszenie i prędkość przelotową do 45%. Pilot i silnik nadal wpływają na sterowanie.

Statek pozostaje dynamicznym ciałem Rapier. Sterowanie zmienia pęd impulsami, a zderzenia i obrażenia pozostają fizyczne. Fizyka zachowuje stały krok 1/60 s i interpolację obrazu.

Testy sprawdzają krótki rozbieg, wyhamowanie po puszczeniu spacji, hamulec przy wciśniętej spacji, zmianę kierunku o 90 stopni, granicę kąta, celowanie przy środku statku i dotychczasowe mechaniki misji. Parametry można dalej dostroić po ograniu.

22 testy, TypeScript, lint i build przeszły. W osobnej kampanii przeglądarkowej sprawdzono przyspieszanie, automatyczne wyhamowanie, szybki skręt, hamulec oraz instrukcję w pauzie. Bieżąca wyprawa użytkownika nie była odświeżana podczas testowania.
