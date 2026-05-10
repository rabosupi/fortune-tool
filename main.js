// 本音の相談室 - 鑑定依頼フォーム 制御ロジック
const SUPABASE_URL = 'https://kjkeaprdbfyqktpdundl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vSliO-snOoFN9nNux7M60Q_65dBwyEp';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('fortune-form');

    // プラン設定のマッピング（文面の「次の扉」の世界観に合わせて更新）
    const PLAN_CONFIG = {
        'trial': { name: '簡易鑑定（入り口の対話）', color: 0x95a5a6, needOrder: false },
        'std-r8b': { name: '通常鑑定（本音の扉）', color: 0x2ecc71, needOrder: true },
        'adv-q2w': { name: '深層鑑定（真実の扉）', color: 0x3498db, needOrder: true },
        'prm-z5v': { name: '最深層鑑定（宿命の扉）', color: 0xf1c40f, needOrder: true }
    };

    // URLからプランを取得
    const urlParams = new URLSearchParams(window.location.search);
    const planKey = urlParams.get('p') || 'trial';
    const currentPlan = PLAN_CONFIG[planKey] || PLAN_CONFIG['trial'];

    // 画面表示の初期化
    const initForm = () => {
        const titleEl = document.getElementById('form-title');
        const planInp = document.getElementById('plan');
        const orderIdGroup = document.getElementById('order-id-group');
        const orderIdInput = document.getElementById('order_id');
        
        // ラベル切り替え用の要素取得
        const nameLabel = document.querySelector('label[for="name"]');
        const nameInput = document.getElementById('name');

        if (titleEl) titleEl.innerText = currentPlan.name;
        if (planInp) planInp.value = currentPlan.name;
        
        if (orderIdGroup && orderIdInput) {
            if (currentPlan.needOrder) {
                // 有料プラン（ココナラ）の設定
                orderIdGroup.style.display = 'flex';
                orderIdInput.required = true;
                if (nameLabel) nameLabel.innerHTML = 'お名前（ニックネーム可） <span class="tag-required" style="color:var(--error); font-size:0.7rem;">(必須)</span>';
                if (nameInput) nameInput.placeholder = '例：匿名希望';
            } else {
                // 無料プラン（note/Threads）の設定
                orderIdGroup.style.display = 'none';
                orderIdInput.required = false;
                if (nameLabel) nameLabel.innerHTML = 'ThreadsID <span class="tag-required" style="color:var(--error); font-size:0.7rem;">(必須)</span>';
                if (nameInput) nameInput.placeholder = '例：@username';
            }
        }
    };
    initForm();

    // 生年月日入力フィールドの取得
    const yearInp = document.getElementById('year');
    const monthInp = document.getElementById('month');
    const dayInp = document.getElementById('day');

    /**
     * 入力された数値を YYYY/MM/DD サーバーへの送付用
     */
    const getFormattedDate = () => {
        const y = yearInp.value;
        const m = monthInp.value.padStart(2, '0');
        const d = dayInp.value.padStart(2, '0');

        if (y.length === 4 && m !== '00' && d !== '00') {
            return {
                display: `${y}/${m}/${d}`,
                db: `${y}-${m}-${d}`
            };
        }

        return null;
    };

    // 入力のたびにコンソールで確認（デバッグ・検証用）
    const inputs = [yearInp, monthInp, dayInp];
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const formatted = getFormattedDate();
            if (formatted) {
                console.log('表示用:', formatted.display);
                console.log('DB用:', formatted.db);
            }
        });
    });

    // 送信時の処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formattedDate = getFormattedDate();
        if (!formattedDate) {
            alert('生年月日を正しく入力してください（例: 1990年 1月 1日）');
            return;
        }

        // 有料プラン時の注文IDチェック
        const orderId = document.getElementById('order_id').value.trim();
        if (currentPlan.needOrder && orderId.length < 4) {
            alert('注文ID（頭4文字）を入力してください');
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = '送信中...';

        const data = {
            name: document.getElementById('name').value,
            birthdate: formattedDate.db,
            genre: document.getElementById('genre').value,
            treasure: document.getElementById('treasure')?.value || '',
            fear: document.getElementById('fear')?.value || '',
            consultation: document.getElementById('consultation').value,
            plan: currentPlan.name,
            order_id: orderId
        };

        const { error } = await supabaseClient
            .from('consultations')
            .insert([data]);

        if (error) {
            console.error('保存失敗:', error);
            alert('送信に失敗しました: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = '鑑定を依頼する';
            return;
        }

        console.log('保存成功');

        // 画面切り替えの演出
        const formContainer = document.querySelector('.form-container');
        const successScreen = document.getElementById('success-screen');
        const successMsg = document.getElementById('success-message');

        // メッセージの出し分け
        if (currentPlan.needOrder) {
            successMsg.innerText = 'ご購入ありがとうございました。鑑定結果はココナラのトークルームにてお届けいたします。';
        } else {
            successMsg.innerText = 'ご依頼ありがとうございました。鑑定結果はThreadsのメッセージにてお届けしますので、今しばらくお待ちください。';
        }

        // フェードアウト
        formContainer.style.opacity = '0';
        formContainer.style.transition = 'opacity 0.5s ease';

        setTimeout(() => {
            formContainer.classList.add('hidden');
            successScreen.classList.remove('hidden');
            successScreen.style.opacity = '0';
            successScreen.style.transition = 'opacity 0.8s ease';

            // ヘッダーの文言も調整
            const mainTitle = document.querySelector('.main-title');
            const subTitle = document.querySelector('.sub-title');
            if (mainTitle) mainTitle.innerText = '送信完了';
            if (subTitle) subTitle.innerText = 'ご依頼ありがとうございました';

            setTimeout(() => {
                successScreen.style.opacity = '1';
            }, 50);
        }, 500);
    });
});
