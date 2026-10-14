# Prototyp 0.8 — WASD, celowanie, laser, kamera i luźny hol

## Sterowanie

| Wejście | Działanie |
| --- | --- |
| W | Przyspieszanie w kierunku kadłuba |
| A / D | Skręcanie w lewo / prawo; oba klawisze jednocześnie znoszą się |
| S | Hamowanie, następnie lot wsteczny; ma pierwszeństwo przed W |
| Shift + W | Boost prędkości i przyspieszenia |
| Mysz | Niezależne celowanie działkami i laserem |
| LPM | Działka bojowe |
| PPM | Krótkozasięgowy laser wydobywczy i przyciąganie minerałów |
| E / R | Dotychczasowe interakcje / naprawa |
| 1–8 / Esc | Nawigacja / pauza |

Spacja nie steruje lotem. Po puszczeniu W lub S statek automatycznie wyhamowuje. Podczas ciągu asysta koryguje wektor ruchu do kierunku kadłuba. Skręt jest płynny, z ograniczeniem szybkości: Prospector 3,2 rad/s, Swift 3,8, Mule 2,6, przed premią pilota. Po puszczeniu klawisza obrotu obrót łagodnie wygasa. Cechy i umiejętności pilotów nadal wpływają na obrót i hamowanie.

S najpierw usuwa ruch do przodu oraz silny dryf boczny, potem uruchamia wsteczny do 35% normalnej prędkości. Boost zwiększa prędkość ×1,65 i przyspieszenie ×1,4 tylko przy ciągu do przodu. Trzymanie samego Shift nie porusza statku; boost nie wzmacnia wstecznego. W prototypie boost nie zużywa paliwa i nie ma przegrzewania. Awaria napędu nadal ogranicza ciąg i prędkość do 45%, także podczas boostu i wstecznego.

## Działka i laser

Dwa działka mają oddzielne punkty montażu po bokach kadłuba. Są rysowane pod nim, obracają się do kursora i strzelają na przemian. Pocisk wychodzi z końca aktualnej lufy, dziedziczy prędkość statku i bada przebytą drogę przez ray cast. Obracanie działek nie obraca kadłuba ani nie zmienia kierunku napędu.

| Narzędzie | Obrażenia | Zasięg |
| --- | --- | --- |
| Działka | 18 na kadłub, 2 na skałę | Prędkość pocisku 1150, życie 1,15 s |
| Laser | 150/s na skałę, bez obrażeń kadłubom | 230 jednostek |

Laser zatrzymuje się na pierwszej skale lub wrogim kadłubie. Ulepszenia modułu wydobywczego, kadłub Mule i umiejętność wydobycia wzmacniają laser, a obrażenia działek pozostają stałe. Istniejący moduł `drill` zachowuje poziomy i koszty; w hangarze nazywa się teraz Laser wydobywczy. Nie potrzeba migracji kampanii.

Minerały w wiązce są przyciągane szybciej i z większej odległości niż zwykły magnes pobliskiego łupu. Limit ładowni nadal obowiązuje. Laser, działka i ciąg, także wsteczny, przerywają naprawę, skanowanie oraz podjęcie sygnału. Dokowanie wymaga spokojnego lotu bez strzelania i lasera. PPM nie otwiera menu przeglądarki; utrata fokusu, opuszczenie strony i pauza nie pozostawiają wciśniętego przycisku.

## Kamera i hol

Kamera ustawia statek w środku ekranu i obraca świat do kierunku, w którym jego nos wskazuje górę. Podczas skrętu jest niewielkie opóźnienie, potem kadłub wraca dokładnie do góry. Easing jest wykładniczy, zależny od czasu i używa krótszej drogi obrotu przez granicę ±π. Z kamerą obracają się asteroidy, stacja, tło i gwiazdy. HUD pozostaje nieruchomy; nazwy miejsc badawczych pozostają czytelne. Minimapę zachowano w orientacji świata, a ekranowa strzałka celu uwzględnia obrót kamery. Celowanie przelicza pozycję myszy przez odwrotny transform kamery, także po skalowaniu okna. Widoczność obiektów sprawdzamy po obrocie do przestrzeni ekranu.

Po podjęciu celu hol zostaje zaczepiony za statkiem. Obiekt ma własną pozycję, prędkość, orientację i interpolację. Luźna lina nie ciągnie; po rozciągnięciu sprężyna przyciąga obiekt do zaczepu. Tłumienie ogranicza kołysanie, a maksymalna odległość od zaczepu to 230. Podczas hamowania i skrętów obiekt zachowuje bezwładność. Lina jest krzywą, z większym ugięciem przy luzie. Ograniczenie kontaktu zapobiega nakładaniu celu na statek, uwzględniając także kapsułę przy holowanym wraku.

Hol jest modelem punktowej masy z ograniczeniami, działa w tym samym kroku 1/60 s co misja. Nie ma jeszcze osobnego ciała Rapiera kolidującego z asteroidami, obrażeń holowanego wraku ani zerwania liny. Nie obciąża silnika i nie zajmuje ładowni. Rozliczenie oraz polityka straty akcji ratunkowej pozostają dotychczasowe. Odświeżenie aktywnej wyprawy nadal oznacza przegraną; format zapisu pozostaje 6.

## Weryfikacja

Przeszły 82 testy. Nowe przypadki mierzą boost i wsteczny, celowanie z obu luf przy innym kierunku kadłuba, małe obrażenia skałom od działek, dużą moc i ograniczony zasięg lasera, osłonę pierwszego trafionego obiektu, przyciąganie minerałów, przerywanie spokojnych czynności, easing kamery przy 30/60/144 FPS oraz bezwładność i ograniczenia holu. Test rzeczywistej akcji ratunkowej sprawdza podjęcie i brak nakładania wraku z kapsułą na statek. Poprzednie testy lotu i wydobycia dostosowano do nowych zasad. Kontrola typów, lint i build produkcyjny pozostają obowiązkowe.

W przeglądarce, na osobnym zapisie pod portem 3001, sprawdzono lot W, skręt D i obrót otoczenia, boost, hamowanie/wsteczny S, niezależne strzelanie w bok oraz wydobywanie PPM, które przyniosło 5 rudy. Drugi scenariusz obejmował podjęcie kapsuły i wraku przez E, ciąg, skręcanie oraz ruch celu na luźnej linie. Po powrocie i dokowaniu odzyskano Nelę Rook oraz Mule #2, a pilot ratownik otrzymał 20 PD. Konsola nie zgłosiła błędów ani ostrzeżeń. Testy nie korzystały z zapisu użytkownika na porcie 3000.

Zrzuty: [niezależne działka i kamera](screenshots/wasd-aim-v0.8.jpg), [bezwładność holu](screenshots/tow-inertia-v0.8.jpg), [zabezpieczony odzysk](screenshots/tow-return-v0.8.jpg).
