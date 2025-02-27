import { Call24Regular, Globe24Regular, Mail24Filled } from '@fluentui/react-icons';
import styles from './Footer.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faYoutube, faInstagram} from '@fortawesome/free-brands-svg-icons'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
const Footer = () => {
    return (
        <div className={styles.row}>
            <div className={styles.column}>
                <h5 className={styles.footerListHeader}>Have Questions?</h5>
                <ul className={styles.footerItemList}>
                    <li>
                        <a href="https://hhsasa.servicenowservices.com/ach?spa=1" target='_blank'> <Globe24Regular /> ASA Connet Hub</a>
                    </li>
                    <li>
                        <Call24Regular /> 1-866-699-4872
                    </li>
                    <li>
                        <Mail24Filled /> <a href="mailto:OCIO_Service_Desk@hhs.gov">OCIO Service Desk</a>
                    </li>
                    <li>
                    <FontAwesomeIcon icon={faQuestionCircle} size='xl' /> <a href="https://hhsasa.servicenowservices.com/ocio?id=sc_cat_item&sys_id=1c1f0a94dbc997002ba5362f7c961910&sysparm_category=16bd55ef1b4fdc54a56243bae54bcba2" target='_blank'>Service Catalog</a>
                    </li>
                </ul>
            </div>

            <div className={styles.column}>
                <h5 className={styles.footerListHeader}>HHS Information</h5>
                <ul className={styles.footerItemList}>
                    <li><a href="https://www.hhs.gov/about/index.html" target='_blank'>About HHS</a></li>
                    <li><a href="https://www.hhs.gov/web/policies-and-standards/hhs-web-policies/plugins/index.html" target='_blank'>File Viewers &amp; Players</a></li>
                    <li><a href="https://www.hhs.gov/web/policies-and-standards/hhs-web-policies/accessibility/index.html" target='_blank'>Accessibility</a></li>
                </ul>
            </div>
            <div className={styles.column}>
                <ul className={styles.footerItemList}>
                    <li><a href="https://www.hhs.gov/web/policies-and-standards/hhs-web-policies/privacy/index.html" target='_blank'>Privacy</a></li>
                    <li><a href="https://www.hhs.gov/about/agencies/asa/eeo/resources/no-fear-act/index.html" target='_blank'>No Fear Act</a></li>
                    <li><a href="https://oig.hhs.gov/" target='_blank'>OIG</a></li>
                    <li><a href="https://www.hhs.gov/civil-rights/for-individuals/nondiscrimination/index.html" target='_blank'>Nondiscrimination</a></li>
                    <li><a href="https://www.hhs.gov/vulnerability-disclosure-policy/index.html" target='_blank'>Vulnerability Disclosure Policy</a></li>
                </ul>
            </div>
            <div className={styles.column}>
                <h5 className={styles.footerListHeader}>Connect with HHS</h5>
                <div className={styles.socalMediaLinks}>
                    <a href="https://www.facebook.com/HHS/" title="Facebook" target="_blank"><FontAwesomeIcon icon={faFacebook} size='xl' color='white' /></a>
                    <a href="https://twitter.com/HHSGov" title="Twitter" target="_blank"><FontAwesomeIcon icon={faTwitter} size='xl' color='white' /></a>
                    <a href="https://www.youtube.com/channel/UC1ZRVOl5MFHIXU4zZr-Oglg" title="Youtube" target="_blank"><FontAwesomeIcon icon={faYoutube} size='xl' color='white' /></a>
                    <a href="https://www.instagram.com/hhsgov/" title="Instagram" target="_blank"><FontAwesomeIcon icon={faInstagram} size='xl' color='white' /></a>
                </div>
            </div>
        </div>
    )
}

export default Footer;