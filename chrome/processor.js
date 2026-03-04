// processor.js — Veo Watermark Remover core engine
// Runs inside processor.html. On load: gets video from background, processes, downloads result.
// KEY: Uses FFmpeg to encode JPEG frames → MP4 directly. NO MediaRecorder, NO WebM intermediate.

// ═══════════════════════════════════════════════════════════════════
// LOGO DATA & WATERMARK REMOVAL (identical to remove-watermark.html)
// ═══════════════════════════════════════════════════════════════════

const LOGO_DATA = {
    hori_720: {
        src: 'data:image/png;base64,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',
        x: 1150, y: 650, w: 130, h: 70,
    },
    hori_1080: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANwAAABuCAIAAADDOuqoAAASbklEQVR42u2d208UdxvH57yzu7MchAWERSgriIAcBAStWpVa07SpJm3T2BvT1iZN400vmt72on9Cb5u06YXBtrESG1NNS60KURZURBBEObNQEPY4szvH9+J5nXe64MoqCO37fG5cN7Oz68x3nvPvJ0EgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgCIIgyMaCoiiCIGiafp4zwEkoiiJJEi+pFQYvQXJIkjQMIyMj4+WXX/b7/Zqm8TyflpY2NDQ0NjbGsqyiKKAqwzBWflqapsvLyzMyMhiGoWlaVdWhoaHp6Wm84CjKpwNSy83N/eCDD6LRqCRJBEHY7fbu7u6vv/5aUZRU5Qjs3bv3xIkTsViMYRhZltPS0s6dO/fDDz/gBUdRrsjP6ro+ODh4+/Ztt9sNhlOW5YyMDHDfuq7Dmymdtry8PBQKhUIhlmXhsz6fD6/2f685XoLk6LoOL9ra2mia1jRN13VN0xwOR0lJCegpVUUKglBWViZJEs/zJElmZGSMjY2NjIzg1UZRpsaDBw8kSVJVVdd1RVE4jmtubjYMI9U0hSTJ8vJyp9Op67qu6zRNy7Lc19eHVxhFmZqMaJqWJGl4eNhut6uqarPZZFmuqqrKyMhI1UwahrF7925w+oCmaTdv3sTrjKJMTUaapmma1tXVRRAEwzCapnEcxzBMVVUVVHZWrm+e5/Pz8wOBAE3TLMvabLaRkZHkeTf5d57n6XrOM6AoNxxDQ0OBQAAqixRFaZq2Y8cOM+hcob6bm5uhDAQqYRimq6vrScoGDRkWEjSa6tNlngRF+S8hHA739/eDw5VlmSAIr9frcrlSCgNqa2ut4pibmxscHHySsq0aWirElOT1DyrRoyhT4/r162DnKIoyDMNms+3bt2/lH/d4PEVFRZDiQGo/Ojq6sLAAJ0xu/KAJZB7zDLHsSoyrVfrrpWMUZWoB2fDw8OTkJEhEVVWKoiorK1d+hsrKSpvNZnphwzAgTgWZJthF8wVFUTRNcxxnt9tdLpfL5XI6nU6nc1lDmERJyX03fBF8F7BeASgWz1Nr7RAEcefOnZaWFriLkUgkPz+/oKBgamrqqWfgeb6mpkaWZQglCYJYXFwcHR2F+vzS4zmOU1XV7Xbv3LmzsLBwy5YtNE0LgqCqajQalWV5dna2r69vYGBgcXExwSKu0I6CvWcYZseOHUVFRV6v1263syxLEISiKIZhTE9PDw4ODgwMBINBaLHG4/G1jkpRlCn3wX0+3+HDh6FUCeaturp6enraMAyorj/p40VFRbm5uVAMUlWV5/k7d+6EQqGEewwWS9d1u91+4MCBpqYml8sFhhlKpCRJCoJAkmRRUVFTU5Pf729vb29vb9c0jWEYVVXNn5o8vjQMw263NzU1NTc3FxQUsCyrqqqqquagCUmSHo+nubk5FAr5fL7z589HIhHQ8ZpeZxqllirRaLSsrCwnJ8d8x+Fw9PT0qKqa/G4dPny4pKREURSWZcE5njt3zmrkrM7X6/W+9957e/bsYVkWjBP1GPNgWZYVRbHZbNXV1VVVVf39/dFoNHlmY4aMFEUVFxe///77LS0tgiAoiiKKIgQSsizDwwZBhaZpJElu3bp1165dgUBgJT4BRflCY0rTEVdUVMTjcZDIpk2bBgcHHz16RCRtLR49etRut4OYWJadmJi4dOmS6bjh5GClSktLT506lZeXp+s6RK4JpUqKohiGgdcsy8Zisby8vEOHDt25cycQCDxJlNb0Ze/evSdPniwoKJAkCSoJHMfB2eAYeAEyBcvtcDjq6+sFQVjr/hOKMjXfDa8XFhZaWlooipJlmaZpnudnZ2eHh4eTpAUVFRX79u3TNM0wDHD9nZ2d9+/fT6j46LouCMIXX3yhKApU6VVVLSgoiMViExMTHR0dPp+vu7t7ZmYG+u8cx8XjcWg4KYqye/fukZEReDyW/TEgr/r6+uPHj9M0HY/HCYKIx+N2u52m6VgsNj4+7vf75+fnI5EIx3FOp9OMSWKxmGEYhYWFDodjcHAw4UHFmHI9Ex2SJMPh8IMHDyDzALFWVVX9/vvvMK5hHgnTlvB6+/btYHXAG4qi2Nvba81v4FMsy37yySdgMkmSjEajTqfzu+++6+vrm5iYgGPMueDMzMw333yzsbExEonwPA/SOXny5FdffRUMBpe52Qyjqmp+fv6JEycURdE0DYy9IAjj4+NXr14dGBgIh8Pwm8FSVldXv/HGG1u2bBFFEaJVwzCOHDkyNzfX2dmZJIBGS7kOCIJQUVEBvlXTtPT09Lt37yYEiKbmWJY9fvw4VN3B409PT7e3ty9NcQ4dOrRnz55gMJiVlRUKhSiK+v777//8889gMGgebEZ7oijeunVL07Tq6mpRFDmOE0XRbrdLkjQ2NkYsN/HEMMzHH3+cnp4uyzIkagzDXLx4sbW19eHDhxC8Qv4OT5ff7+/o6MjOzi4oKID8DKyj1+vt7e0Nh8NYp9xA3L17V5IkmqbN9kx1dfWT/H51dbXD4YBbDh7T5/OBmbHGeSzLvv7665FIJDMzMxQKEQRx9uzZnp4es2xOPG4LgbLhnV9//bW9vd1ms8XjcdDlq6++umyfiabpmpqa4uLiUCgExR1ocl64cMHMcuBBgn8R6FJRlG+//fbKlStgawmCUFXV6XSm1DVAUb4I/H7/xMQETdNmb2bnzp0Oh2Np8gvOHUo8BEHYbDaCIEZGRqzNRkiu3333XbjroNf+/v6Ojg7TaJlHQpBgenzDMH788cf5+XmGYWKxGMSaFRUVSwM+TdOOHDkSi8UgoycIYnJy8vTp09YBvGVjRFVVf/rpp4mJCTPlEkWxubl55S1WFOULoqenh2EYiL1UVU1LS/N4PAkxIkmSdru9srJS13XQAcuy9+/fn5mZWepbvV6vqqoQiSqKcunSJasWk8e7HR0dFEU5nU4wqxUVFUs/VVRUtHnzZogjSZKUZfny5csr7JWrqgpjzpDeQSG9rq4ORbmxGBwcXFhYMHMIlmUbGhqWymXbtm1gUcDGxGKx27dvLy0zZWZmCoIAi8gIghgfH19aEUyoClmXU/b19UGCAlPDOTk5CaoiSbK+vh5KP5BvLS4u3rp1yyx8Js+jDcN48ODB+Pg4y7JQZ4UhKQI7OhsHmqbn5+cnJydra2vNogyk2NYSEkmSNTU10IwBm7qwsHDjxg1zfQ9kxCRJ5ubmulyuYDDocDg0TcvMzDx27Njs7CzP84qimOtxrcVzlmUlSYJvLywsJAgiFApB+wfOZk28KIqCqiT8eKfT6fP5zPbP0kLmsnlSX1+f1+uVJIkkyXg8npeX96SqGYpyHYDKTl9fX2NjoyRJuq5zHMfzfHV1dW9vr/UeQ5IOHtBmsw0PD0MkCvfPrKoUFxdHIhHwqgzDZGVlHThwwGazQVq9bHPcOmABJxQEQdM0u93OcVxmZiaI0nw8srKyoMkJltKs9j9VSXAGiqIePnwI887wbNjt9uzs7Pn5+WcYpUP3vVbl9N7eXr/fb942wzBqa2shWQFFNjY2CoIgy7KZ1nR2dpozQdYb6XQ6Tb9MEAT0uKHXAjVFaExDuCnLsizLqqpqj4HzQPdFFEWKotxut9mVMTdQMH+YoijBYHCFpW/z5PDV1p+d0uA9ipJ4Aatvo9Fod3e3WULXNM3r9ZpDZYZh7Nq1y+xGMgwzNTU1Ojqa0Fo0Ta+1u82yLMMw5meXBpTW3qP5QYj2eJ4HB22W7pfOsRMEAWWgZ3sarWHMqjd10H0/OxAL3r59u6WlBYwfRVHp6elQWIa4MC8vDw4Dj9nb27usjwPnCCNtIJ3Ozs6rV69Cvd301Nb+uKlsqzrhr4IgQF6SEBFCjROMNAxopjq7zjAMPCrWJ3O1QkkUJbFavceRkRFJkjiOg0I6dJah4l1aWpqenh6JRGw2GyQ6N2/eTLiF5l9DoRC0TCCt1nV9YmLCHEV7/gapYRiRSAT0Cr8zJycnpfMbhgGFWPjNMNYZiUSsM8vovjcKXV1ddrsdpncJgti6dSvP87qu79q1y5zxgVWLc3Nzy2YqJEnCoggwRYZhlJSUgDEmVm9XhVgsZg4WGYbh9XohXVv5ScrKysBfUxQFVQKr1cSYcgNx7do1KCbD3bLZbPX19TRNl5SUaJoGw7M2m62rqyvJ0sfx8fFYLAZ1aY7j0tLSMjMzn5pJrFxShmEMDQ2Zj4Gmafn5+cnXrSeUiux2e1lZGWRgEAlMTU3B6BCKcsMxNzc3NDRkzivour5nz56DBw/CnBi4Y0mSoGb+pFsI87Ngw1RVTU9PLy8vt8aOVv1Z8/SV63JkZAQGyyGmFAQhSUtm6WkrKyvdbjcYV/jHzs7O4pTQxo0soUIJE0NmxsPzPMuy0P3z+Xw9PT1JjAoU0quqqsCYOZ3O/Px8qB+ZLn7pCCNEcgzDHDt2bP/+/enp6eFwWBRFUF6CsEKhUENDA8/z5qhRaWnp/fv3YTH70pEla91HEISPPvoIMnoISHRd//nnn2FQaHUTcBTl6iCKYmNjo7W4IwiCuXuloigXLlyAiiaRdMijrq7O5XIZhrG4uJiVlVVXV3fjxo2llR1rzk5R1MGDB48ePep2uxsaGvbv319aWjo6OhqJRJbqXtO0nTt3QvgLZfby8vJ79+5Zh9DMyhFk+vAtn376aU5OTjQaBU3run7jxo3r16+vxUpcFCWxKsskYrFYWVmZ2+1WFMXcJ8jMx0VRbGtrS9DWk9JkmKVgWTYYDObk5OzYsWN8fDwajSbEo2Z56JVXXnnrrbcikQisszEMIysr68qVK0tFSRDE1NSU1+vdvHmzLMsURcXjcUEQampqFhcXZ2ZmrMvPYZUtDAWfOnWqsLBQlmVBEERR1DRNFMXW1laodK56SQhFuWorJRiGqampsU5JwvJCm8127dq1gYGBlZxkbGysoKDA4/HE43Ge50OhUG5ublNTE0EQwWAwHo9bpVlSUvLOO+8cOnQImtHwMAiC0Nraevfu3SfpfmZmpra2FoJXnuej0Wh6enpdXV1RUVEwGITBNijdFxYWvvbaa2+//bbL5YKJuGg0CmX5M2fOQL90Ta4nSmq1cDqdn3/+ucPhYBgGvDakOBRFffnll4FA4Kn1PNNvfvbZZ0VFRRBcQjJO03Q4HF5YWFhcXIzH4y6Xy+12W3NnqDgyDNPe3n7x4sVlzSTxeIyjsrLyww8/hLQMVurAFgkMw0iSJIoi7ArLcZw5eUlRFIwGu1yuM2fO/Pbbb8+8tTZayhfhu81u8qZNm7Zt2waeERIXhmH6+/uvXbtmTVae6sF9Pp/H48nLy4OVihDVORyOzMxMj8fj8XhycnKgjg3HQxOcYZjLly+fPXsW2tNJMqpHjx7Nzc2Vlpa6XC5JkqB1DuvUSJLkOA5m7aCYBd8ei8UEQbDZbKdPn/7jjz+eYeMDFCWxXhtRNzQ0wB5/IFZBEM6fP2/u9JdclBCDgm56enokSSouLs7OzoZIAOrwMNsB72iaBg4Uphvb2touXLjAMMxTN4LTdX1qaurevXubNm3yeDzQbzRbnWbaDvUjUKrD4RgaGmptbe3u7oY5j2fYMBZF+aKNpWEYgUAA6jLQ9tB1PRgMtrW1gQdMfgvheOs7o6Oj3d3dBEHA/kEwbAFuGrYAhoEgURT7+/u/+eabe/fupTRCFg6Hu7q65ufnYXMis1TEcRzInaZpyNumpqbOnj37yy+/zMzMQNr+1BUUGFNuILKzsx0OB9xgWZYjkUggEDBHy54tAuN53u12b9u2zePxgGOFjGdycnJycvLhw4fgZM31u6men6Zpl8u1ffv2l156ybrsZnJy0u/3+/3+v/76y7p0OGHvF0x0/gFbFZiNFuta1dX6lmVt4arow7rJoDVYXJWhEBTlv3CvGGvm/mK24l2LDAZFuc4m02pglo6rJd+EI0kildxkrsp/72eddls7H42sf8HoObOBZXftWbtNTdd9M18E2WAPM16CdbGgz+C+Cfx/dBAEQRAEQRAEQRAEQRAEQRAEQRAEQRCE+HeOb+AAB4IgSPL5tr9trWR9Hy0oQryQJbam7EiCNGX3v4WVT9AuyhNZwyFf0vonmTiPukyoaRAGYTzD1xv/lhVPyAuaPCcTxGckqsiAY8j/vW2s8Q81/vZtayXu550tT/0RRYgUJ89JIrnkHt+BtbsPeIf/T2BSkQS57nIx/jl6RTP5f/FflpD/IJOJQS0uHENQlAiCokRQlAiyjvwHqahE0t4fyWoAAAAASUVORK5CYII=',
        x: 1700, y: 970, w: 220, h: 110,
    },
    verti_720: {
        src: 'data:image/png;base64,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',
        x: 590, y: 1200, w: 130, h: 80,
    },
    verti_1080: {
        src: 'data:image/png;base64,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',
        x: 880, y: 1800, w: 200, h: 120,
    },
    gemini_720: {
        src: 'data:image/png;base64,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',
        x: 1150, y: 650, w: 130, h: 70,
    },
};

const LOGO_VALUE = 255;

function detectLogo(vw, vh) {
    const isVert = vh > vw;
    return (Math.max(vw, vh) >= 1440)
        ? (isVert ? LOGO_DATA.verti_1080 : LOGO_DATA.hori_1080)
        : (isVert ? LOGO_DATA.verti_720 : LOGO_DATA.hori_720);
}

function loadLogoImage(cfg) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas'); c.width = cfg.w; c.height = cfg.h;
            const x = c.getContext('2d'); x.drawImage(img, 0, 0);
            resolve(x.getImageData(0, 0, cfg.w, cfg.h));
        };
        img.onerror = () => reject(new Error('Failed to load logo img for ' + cfg.w + 'x' + cfg.h));
        img.src = cfg.src;
    });
}

function calculateAlphaMap(lid) {
    const { data, width, height } = lid;
    const a = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
        const idx = i * 4;
        a[i] = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255.0;
        if (a[i] < 0.008) a[i] = 0;
    }
    return a;
}

function removeWatermark(imageData, alphaMap, logoConfig) {
    const { data } = imageData;
    const vw = imageData.width;
    const lx = logoConfig.x;
    const ly = logoConfig.y;
    const lw = logoConfig.w;
    const lh = logoConfig.h;

    for (let row = 0; row < lh; row++) {
        for (let col = 0; col < lw; col++) {
            const ai = row * lw + col;
            const a = alphaMap[ai];
            if (a < 0.005) continue;

            const clampedA = Math.min(a, 0.995);
            const oneMinusA = 1.0 - clampedA;
            const px = lx + col;
            const py = ly + row;
            if (px >= vw || py >= imageData.height) continue;

            const di = (py * vw + px) * 4;
            for (let c = 0; c < 3; c++) {
                const displayed = data[di + c];
                const original = (displayed - clampedA * LOGO_VALUE) / oneMinusA;
                data[di + c] = Math.max(0, Math.min(255, Math.round(original)));
            }
        }
    }
}

function postProcessBlur(imageData, alphaMap, logoConfig, radius) {
    if (radius <= 0) return;

    const { data } = imageData;
    const vw = imageData.width;
    const vh = imageData.height;
    const lx = logoConfig.x;
    const ly = logoConfig.y;
    const lw = logoConfig.w;
    const lh = logoConfig.h;

    const pad = Math.ceil(radius * 2);
    const rx0 = Math.max(0, lx - pad);
    const ry0 = Math.max(0, ly - pad);
    const rx1 = Math.min(vw, lx + lw + pad);
    const ry1 = Math.min(vh, ly + lh + pad);
    const rw = rx1 - rx0;
    const rh = ry1 - ry0;

    const kernelSize = Math.ceil(radius * 2) + 1;
    const halfK = Math.floor(kernelSize / 2);
    const sigma = radius;
    const sigma2 = 2 * sigma * sigma;
    const kernel = [];
    for (let dy = -halfK; dy <= halfK; dy++) {
        for (let dx = -halfK; dx <= halfK; dx++) {
            const w = Math.exp(-(dx * dx + dy * dy) / sigma2);
            kernel.push({ dx, dy, w });
        }
    }

    const regionR = new Float32Array(rw * rh);
    const regionG = new Float32Array(rw * rh);
    const regionB = new Float32Array(rw * rh);
    const regionA = new Float32Array(rw * rh);

    for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
            const si = y * rw + x;
            const px = rx0 + x;
            const py = ry0 + y;
            const di = (py * vw + px) * 4;
            regionR[si] = data[di];
            regionG[si] = data[di + 1];
            regionB[si] = data[di + 2];

            const logoX = px - lx;
            const logoY = py - ly;
            if (logoX >= 0 && logoX < lw && logoY >= 0 && logoY < lh) {
                regionA[si] = alphaMap[logoY * lw + logoX];
            }
        }
    }

    for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
            const si = y * rw + x;
            const a = regionA[si];
            if (a < 0.01) continue;

            const blendStrength = Math.min(1.0, a * 2.0);
            let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

            for (const { dx, dy, w } of kernel) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= rw || ny < 0 || ny >= rh) continue;

                const ni = ny * rw + nx;
                const neighborA = regionA[ni];

                const cleanness = 1.0 - neighborA * 0.7;
                const finalW = w * cleanness;

                sumR += regionR[ni] * finalW;
                sumG += regionG[ni] * finalW;
                sumB += regionB[ni] * finalW;
                sumW += finalW;
            }

            if (sumW > 0.001) {
                const blurredR = sumR / sumW;
                const blurredG = sumG / sumW;
                const blurredB = sumB / sumW;

                const px = rx0 + x;
                const py = ry0 + y;
                const di = (py * vw + px) * 4;
                data[di] = Math.round(regionR[si] * (1 - blendStrength) + blurredR * blendStrength);
                data[di + 1] = Math.round(regionG[si] * (1 - blendStrength) + blurredG * blendStrength);
                data[di + 2] = Math.round(regionB[si] * (1 - blendStrength) + blurredB * blendStrength);
            }
        }
    }
}

function processFrame(imageData, alphaMap, lc, blurRadius) {
    removeWatermark(imageData, alphaMap, lc);
    postProcessBlur(imageData, alphaMap, lc, blurRadius);
}

// ═══════════════════════════════════════════════════════════════════
// FFmpeg helpers
// ═══════════════════════════════════════════════════════════════════
let ffmpegInstance = null, ffmpegLoaded = false;

async function getFFmpeg(onProgress, onLog) {
    if (ffmpegLoaded && ffmpegInstance) return ffmpegInstance;
    const { FFmpeg } = FFmpegWASM;
    ffmpegInstance = new FFmpeg();
    if (onProgress) ffmpegInstance.on('progress', ({ progress }) => onProgress(Math.round(progress * 100)));
    if (onLog) ffmpegInstance.on('log', ({ message }) => onLog(message.slice(0, 120)));

    // Load ffmpeg-core locally. The user confirmed this exact config works in Firefox for this extension.
    await ffmpegInstance.load({
        coreURL: 'ffmpeg-core.js',
        wasmURL: 'ffmpeg-core.wasm'
    });
    ffmpegLoaded = true;
    return ffmpegInstance;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN — runs on page load
// ═══════════════════════════════════════════════════════════════════
function report(pct, label) {
    chrome.runtime.sendMessage({ action: 'PROCESSOR_PROGRESS', pct, label }).catch(() => { });

    // Update in-page UI
    const barFill = document.getElementById('barFill');
    const barPct = document.getElementById('barPct');
    const barLabel = document.getElementById('barLabel');
    const barStep = document.getElementById('barStep');
    const ring = document.getElementById('ring');
    const ringInner = document.getElementById('ringInner');
    if (barFill) barFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    if (barPct) barPct.textContent = pct + '%';
    if (barLabel) barLabel.textContent = label || (typeof __t === 'function' ? __t('proc_loading') : 'Procesando...');
    if (barStep) barStep.textContent = label || '';

    if (pct >= 100) {
        if (barFill) barFill.classList.add('done');
        if (barPct) barPct.classList.add('done');
        if (ring) ring.classList.add('done');
        if (ringInner) ringInner.classList.add('done');
        if (barLabel) barLabel.textContent = typeof __t === 'function' ? __t('proc_completed') : 'Completado';
        if (barStep) barStep.textContent = typeof __t === 'function' ? __t('proc_done_step') : '✓ Descargando…';
    }
}

async function main() {
    try {
        await initI18n();
        applyTranslations();
        report(0, __t('proc_req_video'));
        const data = await chrome.runtime.sendMessage({ action: 'GET_VIDEO_BLOB' });
        if (!data || data.error) {
            chrome.runtime.sendMessage({ action: 'PROCESSOR_ERROR', error: data?.error || __t('proc_error_novideo') });
            return;
        }

        const { videoSource, settings, filename } = data;

        // Show filename in UI
        const fnEl = document.getElementById('filenameEl');
        if (fnEl) {
            fnEl.textContent = filename || __t('video');
            fnEl.classList.remove('placeholder');
        }

        const { blurRadius = 2, fps = -1, format = 'mp4' } = settings;

        let videoBlob;
        if (videoSource.dataUrl) {
            report(3, 'Decoding video data...');
            const resp = await fetch(videoSource.dataUrl);
            videoBlob = await resp.blob();
        } else if (videoSource.url) {
            report(3, 'Downloading video...');
            const resp = await fetch(videoSource.url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            videoBlob = await resp.blob();
        } else {
            throw new Error('No valid video source provided to processor');
        }

        const videoUrl = URL.createObjectURL(videoBlob);

        // Load video metadata
        const tmpVid = document.createElement('video');
        tmpVid.src = videoUrl; tmpVid.muted = true;
        await new Promise((r, j) => { tmpVid.onloadedmetadata = r; tmpVid.onerror = j; });
        const vw = tmpVid.videoWidth, vh = tmpVid.videoHeight, dur = tmpVid.duration;
        report(2, `${vw}×${vh} · ${dur.toFixed(1)}s`);

        // Detect logo & build alpha map
        const logoConfig = detectLogo(vw, vh);
        const logoImageData = await loadLogoImage(logoConfig);
        const alphaMap = calculateAlphaMap(logoImageData);

        const targetFps = fps <= 0 ? 30 : fps;
        const fi = 1 / targetFps;
        const totalFrames = Math.floor(dur * targetFps);

        const cvs = document.createElement('canvas'); cvs.width = vw; cvs.height = vh;
        const ctx = cvs.getContext('2d');

        // ── PASS 1: Process frames → JPEG blobs ───────────────────────
        report(5, __t('proc_processing'));
        const workVid = document.createElement('video');
        workVid.src = videoUrl; workVid.muted = true;
        await new Promise(r => { workVid.onloadedmetadata = r; });

        const processedFrames = [];
        let t = 0, f = 0;
        while (t < dur - fi * 0.5) {
            await new Promise(res => {
                workVid.currentTime = t;
                workVid.onseeked = () => {
                    ctx.drawImage(workVid, 0, 0);
                    const id = ctx.getImageData(0, 0, vw, vh);
                    processFrame(id, alphaMap, logoConfig, blurRadius);
                    ctx.putImageData(id, 0, 0);
                    res();
                };
            });
            processedFrames.push(await new Promise(r => cvs.toBlob(r, 'image/jpeg', 0.95)));
            f++; t += fi;
            report(5 + Math.min(45, Math.round(f / totalFrames * 45)), `${__t('proc_frame')} ${f}/${totalFrames}`);
            if (f % 10 === 0) await new Promise(r => setTimeout(r, 0));
        }
        URL.revokeObjectURL(videoUrl);

        // ── PASS 2: FFmpeg encodes JPEG sequence → target format ──────
        // NO MediaRecorder, NO WebM intermediate. Works in hidden tabs.
        report(50, __t('proc_load_ffmpeg'));
        const ffmpeg = await getFFmpeg(
            pct => report(55 + Math.round(pct * 0.4), `${__t('proc_encoding')} ${pct}%`),
            () => { }
        );
        const { fetchFile } = FFmpegUtil;

        // Write JPEG frames to FFmpeg virtual filesystem
        report(52, __t('proc_write_frames'));
        for (let i = 0; i < processedFrames.length; i++) {
            const fdata = await fetchFile(processedFrames[i]);
            await ffmpeg.writeFile(`frame${String(i).padStart(5, '0')}.jpg`, fdata);
            if (i % 20 === 0) report(52 + Math.round((i / processedFrames.length) * 3), `${__t('proc_writing')} ${i + 1}/${processedFrames.length}`);
        }

        // Encode
        report(55, `${__t('proc_encoding_to')} ${format.toUpperCase()}...`);
        const outFile = `output.${format}`;
        const fpsStr = String(targetFps);

        if (format === 'webm') {
            await ffmpeg.exec(['-framerate', fpsStr, '-i', 'frame%05d.jpg',
                '-c:v', 'libvpx-vp9', '-crf', '18', '-b:v', '0', '-pix_fmt', 'yuv420p', outFile]);
        } else {
            await ffmpeg.exec(['-framerate', fpsStr, '-i', 'frame%05d.jpg',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18',
                '-pix_fmt', 'yuv420p', '-r', fpsStr, outFile]);
        }

        const resultData = await ffmpeg.readFile(outFile);
        const mimes = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska' };
        const resultBlob = new Blob([resultData.buffer], { type: mimes[format] || 'video/mp4' });

        // Clean up FFmpeg FS
        for (let i = 0; i < processedFrames.length; i++) {
            try { await ffmpeg.deleteFile(`frame${String(i).padStart(5, '0')}.jpg`); } catch (e) { }
        }
        try { await ffmpeg.deleteFile(outFile); } catch (e) { }

        // ── Download result directly from this page ───────────────────
        report(98, __t('proc_downloading'));
        const dlUrl = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        report(100, __t('proc_completed'));
        // Wait a moment for download to start, then notify background to close this tab
        await new Promise(r => setTimeout(r, 1500));
        chrome.runtime.sendMessage({ action: 'PROCESSOR_DONE' });
    } catch (err) {
        console.error('[VeoWR Processor] Fatal:', err);
        // Show error state in UI
        const barFill = document.getElementById('barFill');
        const barPct = document.getElementById('barPct');
        const ring = document.getElementById('ring');
        const ringInner = document.getElementById('ringInner');
        const barLabel = document.getElementById('barLabel');
        const barStep = document.getElementById('barStep');
        if (barFill) barFill.classList.add('error');
        if (barPct) { barPct.classList.add('error'); barPct.textContent = '✗'; }
        if (ring) ring.classList.add('error');
        if (ringInner) ringInner.classList.add('error');
        if (barLabel) barLabel.textContent = typeof __t === 'function' ? __t('proc_error_lbl') : 'Error';
        if (barStep) barStep.textContent = err.message || String(err);
        chrome.runtime.sendMessage({ action: 'PROCESSOR_ERROR', error: err.stack || err.message || String(err) });
    }
}

main();
