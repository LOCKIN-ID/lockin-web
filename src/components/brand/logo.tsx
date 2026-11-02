import type { ReactNode } from "react";

/**
 * The brand lockup, drawn from the artwork extracted out of `Lock.in.pdf`
 * (`scripts/extract-brand.py`). Three rules hold everywhere:
 *
 * 1. `public/brand/*` is the only place a logo raster lives.
 * 2. The mark and the wordmark always sit on a forest ground. The deck never
 *    prints them any other way, and mint on paper is 1.4:1, so paper is not an
 *    option the brand colour survives.
 * 3. Every one of these carries its own `alt` or is `aria-hidden` with the name
 *    written next to it, so no screen reader hears "LOCK.IN" twice.
 */

export function Mark({ size = 28, onDark = true }: { size?: number; onDark?: boolean }) {
  return (
    <img
      src="/brand/mark-round.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="shrink-0"
      style={onDark ? undefined : { filter: "brightness(0.55) saturate(0.8)" }}
    />
  );
}

export function LockinLogoSvg({ height = 26, className }: { height?: number; className?: string }) {
  const width = Math.round(height * 5.6463);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 5364 950"
      width={width}
      height={height}
      fill="none"
      className={className}
      style={{ height, width: "auto", display: "block" }}
      aria-label="LOCK.IN"
      role="img"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 3730 761 L 3727 769 L 3727 918 L 3729 925 L 3734 930 L 3740 932 L 3901 932 L 3907 930 L 3912 925 L 3914 918 L 3914 769 L 3911 761 L 3908 758 L 3903 756 L 3738 756 L 3733 758 Z M 1250 245 L 1247 244 L 1244 247 L 1223 279 L 1199 308 L 1175 331 L 1157 345 L 1137 358 L 1103 375 L 1065 389 L 1041 396 L 1022 400 L 1020 402 L 1019 405 L 1022 409 L 1148 410 L 1148 415 L 1140 458 L 1123 533 L 1124 538 L 1126 539 L 1130 539 L 1133 536 L 1152 499 L 1163 481 L 1178 460 L 1188 448 L 1213 425 L 1233 412 L 1262 398 L 1298 385 L 1340 373 L 1343 370 L 1343 367 L 1341 365 L 1223 364 L 1221 361 L 1244 276 L 1251 247 Z M 4500 21 L 4494 28 L 4494 921 L 4496 925 L 4499 928 L 4507 931 L 4656 931 L 4665 928 L 4670 921 L 4671 300 L 5169 910 L 5176 917 L 5190 926 L 5198 929 L 5211 931 L 5350 931 L 5358 928 L 5361 925 L 5363 920 L 5363 29 L 5361 24 L 5358 21 L 5349 18 L 5201 18 L 5194 20 L 5189 25 L 5188 28 L 5187 649 L 5140 593 L 4689 41 L 4678 30 L 4664 22 L 4654 19 L 4645 18 L 4508 18 Z M 4129 18 L 4119 23 L 4116 27 L 4115 31 L 4115 919 L 4120 928 L 4129 931 L 4277 931 L 4285 929 L 4288 927 L 4292 919 L 4292 30 L 4288 22 L 4285 20 L 4277 18 Z M 3420 19 L 3410 22 L 3400 27 L 3384 42 L 3036 469 L 3035 477 L 3038 484 L 3384 907 L 3396 919 L 3410 927 L 3428 931 L 3611 931 L 3617 929 L 3621 923 L 3621 918 L 3616 910 L 3261 474 L 3619 37 L 3621 33 L 3621 27 L 3619 23 L 3616 20 L 3611 18 L 3428 18 Z M 2820 18 L 2812 21 L 2807 26 L 2805 32 L 2805 917 L 2809 927 L 2819 931 L 2967 931 L 2977 928 L 2980 925 L 2982 920 L 2982 29 L 2980 24 L 2977 21 L 2967 18 Z M 8 20 L 3 24 L 0 30 L 0 919 L 1 922 L 5 928 L 14 931 L 432 931 L 450 927 L 461 921 L 473 910 L 575 786 L 579 779 L 578 774 L 575 769 L 570 766 L 177 765 L 177 31 L 175 25 L 170 20 L 162 18 L 14 18 Z M 2204 3 L 2150 12 L 2116 21 L 2061 41 L 2006 68 L 1971 90 L 1931 121 L 1896 155 L 1865 192 L 1834 238 L 1813 277 L 1796 318 L 1782 367 L 1775 406 L 1771 457 L 1772 506 L 1778 556 L 1783 581 L 1791 611 L 1806 653 L 1829 701 L 1857 746 L 1886 783 L 1922 820 L 1948 842 L 1992 873 L 2025 892 L 2047 903 L 2080 917 L 2120 930 L 2168 941 L 2203 946 L 2244 949 L 2313 948 L 2344 945 L 2370 941 L 2418 930 L 2460 916 L 2486 905 L 2516 890 L 2547 872 L 2591 841 L 2630 807 L 2647 789 L 2648 778 L 2646 773 L 2534 683 L 2525 678 L 2516 679 L 2512 681 L 2478 715 L 2449 737 L 2421 754 L 2379 773 L 2354 781 L 2316 789 L 2288 792 L 2252 792 L 2216 788 L 2184 781 L 2156 772 L 2137 764 L 2105 747 L 2081 731 L 2062 716 L 2022 676 L 2003 651 L 1989 629 L 1973 598 L 1966 581 L 1959 560 L 1951 523 L 1948 496 L 1948 458 L 1951 429 L 1955 408 L 1967 368 L 1974 351 L 1987 325 L 2001 302 L 2029 266 L 2056 239 L 2082 218 L 2110 200 L 2140 185 L 2180 170 L 2218 161 L 2252 157 L 2305 158 L 2326 161 L 2356 168 L 2392 181 L 2430 200 L 2458 218 L 2475 231 L 2490 244 L 2515 269 L 2526 270 L 2533 267 L 2642 180 L 2647 174 L 2648 163 L 2643 155 L 2616 129 L 2592 109 L 2554 82 L 2520 62 L 2490 47 L 2443 28 L 2414 19 L 2386 12 L 2330 3 L 2289 0 L 2244 0 Z M 1059 6 L 1011 16 L 961 32 L 916 51 L 887 66 L 865 79 L 824 108 L 795 133 L 763 166 L 733 204 L 707 245 L 687 284 L 669 331 L 656 383 L 651 417 L 649 441 L 649 501 L 654 548 L 661 584 L 676 634 L 695 679 L 721 726 L 743 758 L 775 796 L 813 832 L 854 863 L 886 883 L 933 907 L 960 918 L 1001 931 L 1030 938 L 1064 944 L 1121 949 L 1181 949 L 1228 945 L 1283 935 L 1337 919 L 1379 902 L 1420 881 L 1461 855 L 1497 827 L 1535 791 L 1562 760 L 1592 718 L 1610 687 L 1632 639 L 1646 597 L 1655 558 L 1661 513 L 1662 455 L 1658 413 L 1652 380 L 1644 349 L 1635 322 L 1624 295 L 1601 250 L 1575 210 L 1546 174 L 1517 144 L 1481 113 L 1440 84 L 1411 67 L 1363 44 L 1304 23 L 1262 12 L 1223 5 L 1166 0 L 1103 1 Z M 1199 166 L 1223 170 L 1256 180 L 1293 198 L 1311 210 L 1332 227 L 1351 246 L 1368 267 L 1382 289 L 1397 321 L 1465 531 L 1462 545 L 1459 550 L 1387 565 L 1398 663 L 1399 664 L 1399 670 L 1389 680 L 1169 696 L 1078 701 L 1022 702 L 1035 708 L 1054 714 L 1099 722 L 1124 724 L 1188 724 L 1217 721 L 1222 722 L 1227 773 L 1226 782 L 1206 787 L 1168 792 L 1128 792 L 1100 789 L 1056 779 L 1019 765 L 993 752 L 973 740 L 948 722 L 935 711 L 923 568 L 924 559 L 932 571 L 945 584 L 962 596 L 990 610 L 1003 614 L 1012 615 L 983 595 L 955 569 L 943 555 L 928 534 L 912 504 L 901 473 L 895 443 L 894 397 L 896 380 L 901 356 L 908 334 L 916 315 L 931 288 L 952 260 L 978 234 L 997 219 L 1022 203 L 1046 191 L 1085 177 L 1115 170 L 1145 166 L 1160 165 Z"
        fill="#12A96A"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 1194 167 L 1140 168 L 1118 171 L 1087 178 L 1062 186 L 1045 193 L 1023 204 L 999 219 L 974 239 L 957 256 L 943 273 L 930 292 L 918 314 L 908 338 L 901 362 L 897 383 L 895 405 L 895 425 L 899 458 L 909 493 L 923 523 L 937 545 L 952 564 L 980 591 L 994 602 L 1015 616 L 1012 617 L 1005 616 L 989 611 L 961 597 L 941 582 L 928 568 L 924 561 L 926 575 L 929 623 L 930 624 L 936 709 L 946 719 L 977 741 L 992 750 L 1020 764 L 1061 779 L 1097 787 L 1121 790 L 1159 791 L 1191 788 L 1221 782 L 1226 779 L 1222 744 L 1221 723 L 1175 726 L 1136 726 L 1104 724 L 1069 719 L 1052 715 L 1031 708 L 1020 702 L 1034 700 L 1067 700 L 1144 696 L 1388 679 L 1392 677 L 1397 671 L 1397 660 L 1385 565 L 1387 563 L 1458 549 L 1460 547 L 1463 533 L 1461 522 L 1397 325 L 1391 310 L 1380 288 L 1365 265 L 1343 239 L 1328 225 L 1309 210 L 1292 199 L 1269 187 L 1240 176 L 1210 169 Z M 1250 243 L 1252 245 L 1250 258 L 1227 343 L 1223 362 L 1339 363 L 1344 367 L 1344 371 L 1339 375 L 1306 384 L 1256 402 L 1232 414 L 1211 428 L 1186 452 L 1172 470 L 1150 505 L 1134 537 L 1131 540 L 1127 541 L 1121 535 L 1135 475 L 1147 411 L 1023 411 L 1018 407 L 1018 403 L 1021 399 L 1060 389 L 1097 376 L 1129 361 L 1155 345 L 1178 327 L 1202 303 L 1223 277 L 1243 246 L 1246 243 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function Wordmark({ height = 26, className }: { height?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center transition-opacity hover:opacity-85 ${className ?? ""}`}>
      <LockinLogoSvg height={height} />
    </span>
  );
}

export function FullLockup({ height = 48 }: { height?: number }) {
  return (
    <span className="inline-flex items-center rounded-card bg-forest-deep p-3 shadow-md">
      <img
        src="/brand/lockup-complete.png"
        alt="SHH... GONNA LOCK.IN"
        width={5364}
        height={1404}
        style={{ height, width: "auto" }}
      />
    </span>
  );
}

/** The deck's stacked lockup: the disc above the name. Always on forest. */
export function Stamp({ size = 40, children }: { size?: number; children?: ReactNode }) {
  return (
    <span className="inline-flex flex-col items-start gap-3">
      <Mark size={size} />
      <img
        src="/brand/logo.svg"
        alt="LOCK.IN"
        width={140}
        height={26}
        style={{ height: "26px", width: "auto" }}
        className="block"
      />
      {children}
    </span>
  );
}

/**
 * "SHH... GONNA", the deck's repeated line. It is white on transparent, so it
 * only ever renders on a forest band, and its repetition is the brand's motion
 * signature rather than an ornament.
 */
export function TaglineImage({ height = 22 }: { height?: number }) {
  return (
    <img
      src="/brand/tagline-shh-gonna.png"
      alt="SHH... GONNA"
      aria-hidden="true"
      width={2292}
      height={244}
      style={{ height, width: "auto" }}
    />
  );
}
