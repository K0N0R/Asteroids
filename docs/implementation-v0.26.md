# Etap 0.26 - tarcze kinetyczne

Każdy z sześciu kadłubów gracza ma własną pojemność tarczy, szybkość regeneracji i opóźnienie po trafieniu. Tarcza pochłania ostrzał i obrażenia od kolizji przed kadłubem; tylko nadmiar obrażeń dociera do poszycia. Promieniowanie poza sektorem omija tarczę.

## Regeneracja i rozwój

- Regeneracja rozpoczyna się po przerwie od ostatniego trafienia i zatrzymuje wraz z symulacją.
- W doku Aurory ładowanie nie wymaga oczekiwania; od pustej tarczy do pełnej trwa najwyżej dwie sekundy.
- Trzy poziomy modułu zwiększają pojemność o 25% i regenerację o 15% bazowej wartości na poziom. Opóźnienie po trafieniu pozostaje zależne od kadłuba.
- Zakup uwzględnia warsztat, surowce i kryształy, a odzysk oraz złomowanie zachowują wartość modułu.
- Starsze zapisy otrzymują moduł poziomu zero, również na statkach rezerwowych i wrakach do odzysku.

## Prezentacja

Niebieskie heksy tworzą pierścień z poświatą wokół statku. Liczba widocznych heksów odpowiada naładowaniu, a pochłonięte trafienie rozświetla tarczę. HUD pokazuje stan tarczy; panel pokładu podaje także regenerację i czas oczekiwania.

## Weryfikacja

Testy w `tests/kinetic-shield.test.ts` obejmują profile kadłubów, absorpcję i nadmiar obrażeń, regenerację niezależną od kroku czasu, ładowanie w Aurorze, trafienia pocisków, kolizje, promieniowanie, koszty ulepszeń i migrację zapisów.

Kolejny etap: Atlas i Harpun jako wyspecjalizowane kadłuby użytkowe zgodnie z [konceptami floty](fleet-concepts.md).
